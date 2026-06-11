const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

function parseSseBlock(block) {
  let event = 'message'
  let data = ''

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim()
    }
  }

  if (!data) {
    return null
  }

  try {
    return { event, data: JSON.parse(data) }
  } catch {
    return { event, data }
  }
}

export async function streamPost(path, body, onEvent, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Streaming is not supported in this browser')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      const parsed = parseSseBlock(block.trim())
      if (parsed) {
        await onEvent(parsed.event, parsed.data)
      }
    }
  }

  if (buffer.trim()) {
    const parsed = parseSseBlock(buffer.trim())
    if (parsed) {
      await onEvent(parsed.event, parsed.data)
    }
  }
}
