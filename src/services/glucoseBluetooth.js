const GLUCOSE_SERVICE = 'glucose'
const GLUCOSE_MEASUREMENT = 'glucose_measurement'
const RECORD_ACCESS_CONTROL_POINT = '00002a52-0000-1000-8000-00805f9b34fb'

const bluetoothError = error => {
  if (error?.name === 'NotFoundError') {
    return new Error(
      'No se seleccionó ningún dispositivo Bluetooth. Si la lista está vacía, activa Bluetooth y pon el glucómetro en modo de conexión.'
    )
  }
  if (error?.name === 'SecurityError') {
    return new Error(
      'El navegador bloqueó Bluetooth. Usa una página segura (HTTPS) y permite el acceso.'
    )
  }
  return error instanceof Error
    ? error
    : new Error('No se pudo leer el glucómetro Bluetooth.')
}

const decodeSfloat = raw => {
  const mantissaBits = raw & 0x0fff
  const specialValues = new Set([0x07ff, 0x07fe, 0x0800, 0x0801, 0x0802])
  if (specialValues.has(mantissaBits)) {
    throw new Error('El glucómetro envió un valor de glucosa no válido.')
  }

  const mantissa = mantissaBits & 0x0800 ? mantissaBits - 0x1000 : mantissaBits
  const exponentBits = (raw >> 12) & 0x0f
  const exponent = exponentBits & 0x08 ? exponentBits - 0x10 : exponentBits
  return mantissa * 10 ** exponent
}

export const decodeGlucoseMeasurement = dataView => {
  if (!(dataView instanceof DataView) || dataView.byteLength < 10) {
    throw new Error('El dispositivo envió una lectura incompleta.')
  }

  const flags = dataView.getUint8(0)
  if (!(flags & 0x02)) {
    throw new Error(
      'El dispositivo no incluyó la concentración de glucosa en la lectura.'
    )
  }

  const sequenceNumber = dataView.getUint16(1, true)
  const dateParts = {
    year: dataView.getUint16(3, true),
    month: dataView.getUint8(5),
    day: dataView.getUint8(6),
    hour: dataView.getUint8(7),
    minute: dataView.getUint8(8),
    second: dataView.getUint8(9)
  }
  let measuredAt = null
  if (
    dateParts.year > 0 &&
    dateParts.month >= 1 &&
    dateParts.month <= 12 &&
    dateParts.day >= 1 &&
    dateParts.day <= 31 &&
    dateParts.hour <= 23 &&
    dateParts.minute <= 59 &&
    dateParts.second <= 59
  ) {
    const date = new Date(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      dateParts.hour,
      dateParts.minute,
      dateParts.second
    )
    if (
      date.getFullYear() === dateParts.year &&
      date.getMonth() === dateParts.month - 1 &&
      date.getDate() === dateParts.day
    ) {
      measuredAt = date.toISOString()
    }
  }

  let offset = 10
  if (flags & 0x01) {
    offset += 2
  }
  if (dataView.byteLength < offset + 2) {
    throw new Error('El dispositivo envió una lectura de glucosa incompleta.')
  }

  const concentration = decodeSfloat(dataView.getUint16(offset, true))
  // Convert the BLE unit (kg/L or mol/L) to the app's mg/dL unit.
  const milligramsPerDeciliter =
    concentration * (flags & 0x04 ? 18015.588 : 100000)
  if (!Number.isFinite(milligramsPerDeciliter) || milligramsPerDeciliter <= 0) {
    throw new Error('El glucómetro envió un valor de glucosa no válido.')
  }

  return {
    val: Math.round(milligramsPerDeciliter * 10) / 10,
    sequenceNumber,
    measuredAt
  }
}

export const connectGlucoseBluetooth = async ({
  onMeasurement,
  onError,
  onDisconnect
}) => {
  if (
    typeof window === 'undefined' ||
    !window.isSecureContext ||
    !navigator.bluetooth
  ) {
    throw new Error(
      'Este navegador no admite Web Bluetooth en este contexto. Abre Vitalia en Chrome o Edge mediante HTTPS.'
    )
  }

  let device
  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [GLUCOSE_SERVICE] }]
    })
  } catch (error) {
    throw bluetoothError(error)
  }

  if (!device.gatt) {
    throw new Error('El dispositivo seleccionado no ofrece una conexión BLE.')
  }

  let measurement
  let controlPoint
  let closed = false
  const cleanup = () => {
    measurement?.removeEventListener(
      'characteristicvaluechanged',
      handleMeasurement
    )
    controlPoint?.removeEventListener(
      'characteristicvaluechanged',
      handleControlPoint
    )
    device.removeEventListener('gattserverdisconnected', handleDisconnected)
  }
  const disconnect = () => {
    if (closed) return
    closed = true
    cleanup()
    if (device.gatt.connected) {
      device.gatt.disconnect()
    }
  }
  const reportError = error => {
    onError?.(error instanceof Error ? error : bluetoothError(error))
  }
  const handleMeasurement = event => {
    let reading
    try {
      reading = {
        ...decodeGlucoseMeasurement(event.target.value),
        deviceName: device.name || 'Glucómetro BLE'
      }
    } catch (error) {
      reportError(error)
      return
    }

    Promise.resolve()
      .then(() => onMeasurement(reading))
      .catch(reportError)
  }
  const handleControlPoint = event => {
    const value = event.target.value
    if (
      value.byteLength >= 3 &&
      value.getUint8(0) === 0x06 &&
      value.getUint8(2) !== 0x01
    ) {
      reportError(
        new Error('El glucómetro no pudo compartir su última lectura guardada.')
      )
    }
  }
  const handleDisconnected = () => {
    if (closed) return
    closed = true
    cleanup()
    onDisconnect?.(new Error('La conexión con el glucómetro se interrumpió.'))
  }

  try {
    const server = await device.gatt.connect()
    const service = await server.getPrimaryService(GLUCOSE_SERVICE)
    measurement = await service.getCharacteristic(GLUCOSE_MEASUREMENT)
    const characteristics = await service.getCharacteristics()
    controlPoint = characteristics.find(
      characteristic => characteristic.uuid === RECORD_ACCESS_CONTROL_POINT
    )

    device.addEventListener('gattserverdisconnected', handleDisconnected)
    measurement.addEventListener(
      'characteristicvaluechanged',
      handleMeasurement
    )
    controlPoint?.addEventListener(
      'characteristicvaluechanged',
      handleControlPoint
    )
    await measurement.startNotifications()

    if (controlPoint) {
      await controlPoint.startNotifications()
      const requestLastRecord = new Uint8Array([0x06, 0x00])
      if (controlPoint.writeValueWithResponse) {
        await controlPoint.writeValueWithResponse(requestLastRecord)
      } else if (controlPoint.writeValue) {
        await controlPoint.writeValue(requestLastRecord)
      } else {
        throw new Error(
          'El navegador no puede solicitar lecturas almacenadas al glucómetro.'
        )
      }
    }

    return {
      deviceName: device.name || 'Glucómetro BLE',
      disconnect
    }
  } catch (error) {
    closed = true
    cleanup()
    if (device.gatt.connected) device.gatt.disconnect()
    throw bluetoothError(error)
  }
}
