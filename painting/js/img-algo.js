// +------------+
// | Color Algo |
// +------------+

/**
 * Use browser to determine the dominant color.
 * Source : https://stackoverflow.com/a/65986420
 */
function getColorByBrowser(imgEl) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext && canvas.getContext("2d");

  //draw the image to one pixel and let the browser find the dominant color
  ctx.drawImage(imgEl, 0, 0, 1, 1);

  //get pixel color
  const i = ctx.getImageData(0, 0, 1, 1).data;

  return rgbToHex(i[0], i[1], i[2]);
}

/**
 * Manually loop on pixel to get the average color
 * Source : https://stackoverflow.com/a/2541680
 */
function getAverageRGB(imgEl) {
  const blockSize = 5; // only visit every 5 pixels
  const defaultRGB = { r: 0, g: 0, b: 0 }; // for non-supporting envs
  const canvas = document.createElement('canvas');
  const context = canvas.getContext && canvas.getContext('2d');
  let pixels, width, height;
  let i = -4;
  let length;
  let rgb = { r: 0, g: 0, b: 0 };
  let count = 0;
  if (!context) {
    return defaultRGB;
  }

  height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
  width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
  context.drawImage(imgEl, 0, 0);

  try {
    pixels = context.getImageData(0, 0, width, height);
  } catch (e) {
    return defaultRGB; // security error, img on diff domain
  }
  length = pixels.data.length;

  while ((i += blockSize * 4) < length) {
    ++count;
    rgb.r += pixels.data[i];
    rgb.g += pixels.data[i + 1];
    rgb.b += pixels.data[i + 2];
  }

  // ~~ used to floor values
  rgb.r = ~~(rgb.r / count);
  rgb.g = ~~(rgb.g / count);
  rgb.b = ~~(rgb.b / count);

  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Return a map counting the frequency of each color in the image
 * Source : https://stackoverflow.com/a/5162976
 */
function getColorsFreq(imgEl) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.width = canvas.width = imgEl.width;
  ctx.height = canvas.height = imgEl.height;
  ctx.clearRect(0, 0, ctx.width, ctx.height);
  ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);

  let col, colors = {};
  let pixels, r, g, b, a;
  r = g = b = a = 0;
  pixels = ctx.getImageData(0, 0, ctx.width, ctx.height);
  for (let i = 0, data = pixels.data; i < data.length; i += 4) {
    r = data[i];
    g = data[i + 1];
    b = data[i + 2];
    a = data[i + 3]; // alpha
    // skip pixels >50% transparent
    if (a < (255 / 2))
      continue;

    col = rgbToHex(r, g, b);
    if (!colors[col])
      colors[col] = 0;
    colors[col]++;
  }

  const maxKey = Object.keys(colors).reduce(function (a, b) {
    return colors[a] > colors[b] ? a : b
  });
  //const maxKey = _.max(Object.keys(obj), o => obj[o]); // alternate ES6 notation (with Underscore)
  return maxKey;
}