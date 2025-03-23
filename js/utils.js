function animateFontWave (el, fontFamilies) {
  if (!el || !fontFamilies || fontFamilies.length === 0) return

  const text = el.textContent
  el.textContent = ''
  const spans = []

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span')
    span.textContent = text[i]
    el.appendChild(span)
    spans.push(span)
  }

  let charIndex = 0
  let fontOffset = 0

  setInterval(() => {
    const span = spans[charIndex]
    const fontIndex = (charIndex + fontOffset) % fontFamilies.length
    span.style.fontFamily = `'${fontFamilies[fontIndex]}', sans-serif`

    charIndex++

    if (charIndex >= spans.length) {
      charIndex = 0
      fontOffset = (fontOffset + 1) % fontFamilies.length
    }
  }, 100) // Speed of wave movement
}


window.animateFontWave = animateFontWave
