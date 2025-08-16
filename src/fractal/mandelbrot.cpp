#include <emscripten.h>
#include <cstdint>
#include <vector>
#include <cmath>
#include <algorithm>

extern "C"
{

    std::vector<uint8_t> pixels;

    EMSCRIPTEN_KEEPALIVE
    uint8_t *allocBuffer(int width, int height)
    {
        pixels.resize(width * height * 4);
        return pixels.data();
    }

    inline bool inCardioidOrBulb(double x, double y)
    {
        double p = std::sqrt((x - 0.25) * (x - 0.25) + y * y);
        if (x < p - 2 * p * p + 0.25)
            return true;
        if ((x + 1) * (x + 1) + y * y < 0.0625)
            return true;
        return false;
    }

    inline void mandelbrotPalette(double t, uint8_t &r, uint8_t &g, uint8_t &b)
    {
        double tt = t;
        r = (uint8_t)(9 * (1 - tt) * tt * tt * tt * 255);
        g = (uint8_t)(15 * (1 - tt) * (1 - tt) * tt * tt * 255);
        b = (uint8_t)(8.5 * (1 - tt) * (1 - tt) * (1 - tt) * tt * 255);

        r = std::min(255, int(r * 1.1));
        g = std::min(255, int(g * 1.05));
        b = std::min(255, int(b * 1.2));
    }

    EMSCRIPTEN_KEEPALIVE void
    computeMandelbrotTile(int width, int height, double cx, double cy, double scale, int maxIter, int yStart, int yEnd)
    {
        if (pixels.empty())
            return;

        for (int py = yStart; py < yEnd; py++)
        {
            double y0 = (height / 2.0 - py) * scale / height + cy;
            for (int px = 0; px < width; px++)
            {
                double x0 = (px - width / 2.0) * scale / height + cx;
                int idx = 4 * (py * width + px);

                if (inCardioidOrBulb(x0, y0))
                {
                    pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = 0;
                    pixels[idx + 3] = 255;
                    continue;
                }

                double x = 0, y = 0;
                int iter = 0;
                while (x * x + y * y <= 4 && iter < maxIter)
                {
                    double xt = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = xt;
                    iter++;
                }

                if (iter < maxIter)
                {
                    double log_zn = std::log(x * x + y * y) / 2.0;
                    double nu = std::log(log_zn / std::log(2)) / std::log(2);
                    double mu = iter + 1 - nu;
                    double t = mu / maxIter;
                    uint8_t r, g, b;
                    mandelbrotPalette(t, r, g, b);
                    pixels[idx] = r;
                    pixels[idx + 1] = g;
                    pixels[idx + 2] = b;
                    pixels[idx + 3] = 255;
                }
                else
                {
                    pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = 0;
                    pixels[idx + 3] = 255;
                }
            }
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void computeMandelbrotFull(int width, int height, double cx, double cy, double scale, int maxIter, int tileHeight)
    {
        if (pixels.empty())
            return;
        for (int y = 0; y < height; y += tileHeight)
        {
            int yEnd = std::min(y + tileHeight, height);
            computeMandelbrotTile(width, height, cx, cy, scale, maxIter, y, yEnd);
            EM_ASM({ postMessage({tileDone : true}); });
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void exposeHeap()
    {
        EM_ASM({ Module.HEAPU8 = HEAPU8; });
    }

    EMSCRIPTEN_KEEPALIVE
    uint8_t *getPixelBuffer() { return pixels.data(); }
}
