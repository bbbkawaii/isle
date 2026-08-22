import sharp from 'sharp'
async function main() {
  await sharp('/tmp/icon-raw.jpg').resize(512, 512).png().toFile('public/icon.png')
  await sharp('/tmp/icon-raw.jpg').resize(192, 192).png().toFile('public/icon-192.png')
  console.log('icon done')
}
main()
