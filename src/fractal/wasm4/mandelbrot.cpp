#include <emscripten.h>
#include <cstdint>
#include <vector>
#include <cmath>
#include <algorithm>

extern "C"
{

    std::vector<uint8_t> pixels;

    // Allocate shared buffer
    EMSCRIPTEN_KEEPALIVE
    uint8_t *allocBuffer(int width, int height)
    {
        pixels.resize(width * height * 4);
        return pixels.data();
    }

    // Cardioid / period-2 bulb check
    inline bool inCardioidOrBulb(double x, double y)
    {
        double p = std::sqrt((x - 0.25) * (x - 0.25) + y * y);
        if (x < p - 2 * p * p + 0.25)
            return true;
        if ((x + 1) * (x + 1) + y * y < 0.0625)
            return true;
        return false;
    }

    // HSL -> RGB (double precision)
    inline void hslToRgb(double h, double s, double l, uint8_t &r, uint8_t &g, uint8_t &b)
    {
        if (s == 0)
        {
            r = g = b = (uint8_t)(l * 255);
            return;
        }
        auto hue2rgb = [](double p, double q, double t) -> double
        {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1.0 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1.0 / 2)
                return q;
            if (t < 2.0 / 3)
                return p + (q - p) * (2.0 / 3 - t) * 6;
            return p;
        };
        double q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        double p = 2 * l - q;
        r = (uint8_t)(hue2rgb(p, q, h + 1.0 / 3) * 255);
        g = (uint8_t)(hue2rgb(p, q, h) * 255);
        b = (uint8_t)(hue2rgb(p, q, h - 1.0 / 3) * 255);
    }

    // Compute one tile
    EMSCRIPTEN_KEEPALIVE
    void computeMandelbrotTile(int width, int height, double cx, double cy, double scale, int maxIter, int yStart, int yEnd)
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

                uint8_t r, g, b;
                if (iter < maxIter)
                {
                    // Smooth coloring for escaped points
                    double log_zn = std::log(x * x + y * y) / 2.0;
                    double nu = std::log(log_zn / std::log(2)) / std::log(2);
                    double mu = iter + 1 - nu;

                    double hue = std::fmod(0.95 + 10.0 * mu / maxIter, 1.0);
                    double lightness = 0.5 * (1.0 + std::sin(3.1415 * mu / maxIter));
                    double saturation = 0.5;

                    hslToRgb(hue, saturation, lightness, r, g, b);
                }
                else
                {
                    // Inside the set -> black
                    r = g = b = 0;
                }
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
                pixels[idx + 3] = 255;
            }
        }
    }

    // Progressive full canvas
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

    // Expose HEAPU8 to JS
    EMSCRIPTEN_KEEPALIVE
    void exposeHeap()
    {
        EM_ASM({ Module.HEAPU8 = HEAPU8; });
    }

    // Pointer to buffer
    EMSCRIPTEN_KEEPALIVE
    uint8_t *getPixelBuffer() { return pixels.data(); }

} // extern "C"
