import axios from 'axios'
import FormData from 'form-data'

export const getTasksList = async (address) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MCP_API}storage/tasks/deals?wallet_address=${address}`,
  )

  return res.json()
}

export const getTxHash = async (payloadCid) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MCP_API}billing/deal/lockpayment/info?payload_cid=${payloadCid}`,
  )

  return res.json()
}

export const getFileDetails = async (payloadCid) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MCP_API}storage/deal/detail/0?payload_cid=${payloadCid}`,
  )
  return res.json()
}

export const uploadFile = async (
  fileName,
  file,
  wallet_address,
  duration = 180,
) => {
  const form = new FormData()
  form.append('duration', duration)
  form.append('file', file, fileName)
  form.append('wallet_address', wallet_address)

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_MCP_API}storage/ipfs/upload`,
      form,
    )

    return response.data
  } catch (err) {
    // Handle Error Here
    console.error(err)
  }
}
