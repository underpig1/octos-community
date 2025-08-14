#include <emscripten/bind.h>
#include <vector>
#include <cmath>
#include <cstdint>
#include <algorithm>

using namespace emscripten;

std::vector<uint8_t> pixels;

constexpr int LUT_SIZE = 4096;
float LUT[LUT_SIZE][4];

struct LUTInitializer
{
    LUTInitializer()
    {
        for (int i = 0; i < LUT_SIZE; i++)
        {
            double t = i * 0.01;
            LUT[i][0] = 0.5f * (1 + std::sin(0.016 * t + 4));
            LUT[i][1] = 0.5f * (1 + std::sin(0.013 * t + 2));
            LUT[i][2] = 0.5f * (1 + std::sin(0.01 * t + 1));
            LUT[i][3] = 1.0f;
        }
    }
} _lutInit;

emscripten::val mandelbrotTile(int width, int height, int maxIter, double scale, double centerX, double centerY)
{
    if (pixels.size() != width * height * 4)
        pixels.resize(width * height * 4);

    double aspect = width / (double)height;
    double scaleX = scale * (aspect > 1 ? aspect : 1.0);
    double scaleY = scale / (aspect > 1 ? 1.0 : aspect);

    std::vector<double> x0s(width), y0s(height);
    for (int i = 0; i < width; i++)
        x0s[i] = centerX + (i - width / 2.0) * scaleX / width;
    for (int j = 0; j < height; j++)
        y0s[j] = centerY + (j - height / 2.0) * scaleY / height;

    for (int j = 0; j < height; j++)
    {
        double y0 = y0s[j];
        for (int i = 0; i < width; i++)
        {
            double x0 = x0s[i], x = 0.0, y = 0.0;
            double x2 = 0.0, y2 = 0.0;
            int iter = 0;

            // Early bailout
            double p = (x0 - 0.25) * (x0 - 0.25) + y0 * y0;
            if (x0 < p - 2 * p * p + 0.25 || (x0 + 1) * (x0 + 1) + y0 * y0 < 0.0625)
                iter = maxIter;
            else
            {
                while (x2 + y2 <= 4.0 && iter < maxIter)
                {
                    y = 2 * x * y + y0;
                    x = x2 - y2 + x0;
                    x2 = x * x;
                    y2 = y * y;
                    iter++;
                }
            }

            int idx = (j * width + i) * 4;
            if (iter >= maxIter)
            {
                pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = 0;
                pixels[idx + 3] = 255;
            }
            else
            {
                // Smooth coloring
                double log_zn = log(x * x + y * y) / 2.0;
                double nu = log(log_zn / log(2.0)) / log(2.0);
                int lut_idx = (int)((iter + 1 - nu) * 4) & (LUT_SIZE - 1);

                pixels[idx] = (uint8_t)(LUT[lut_idx][0] * 255);
                pixels[idx + 1] = (uint8_t)(LUT[lut_idx][1] * 255);
                pixels[idx + 2] = (uint8_t)(LUT[lut_idx][2] * 255);
                pixels[idx + 3] = 255;
            }
        }
    }

    return val(typed_memory_view(pixels.size(), pixels.data()));
}

EMSCRIPTEN_BINDINGS(mandelbrot_module)
{
    function("mandelbrotTile", &mandelbrotTile);
}
