#include <emscripten/bind.h>
#include <vector>
#include <cmath>
using namespace emscripten;

// Smooth HSV -> RGB
void hsvToRgb(double h, double s, double v, double &r, double &g, double &b)
{
    double c = v * s;
    double x = c * (1 - fabs(fmod(h / 60.0, 2) - 1));
    double m = v - c;
    if (h < 60)
    {
        r = c;
        g = x;
        b = 0;
    }
    else if (h < 120)
    {
        r = x;
        g = c;
        b = 0;
    }
    else if (h < 180)
    {
        r = 0;
        g = c;
        b = x;
    }
    else if (h < 240)
    {
        r = 0;
        g = x;
        b = c;
    }
    else if (h < 300)
    {
        r = x;
        g = 0;
        b = c;
    }
    else
    {
        r = c;
        g = 0;
        b = x;
    }
    r += m;
    g += m;
    b += m;
}

// Compute Mandelbrot for a rectangular region
emscripten::val computeMandelbrotRegion(
    int canvasWidth, int canvasHeight,
    int startX, int startY, int regionWidth, int regionHeight,
    double centerX, double centerY, double scale, int maxIter)
{
    std::vector<uint8_t> buffer(regionWidth * regionHeight * 4);

    for (int py = 0; py < regionHeight; py++)
    {
        double y0 = (canvasHeight / 2.0 - (startY + py)) * scale / canvasHeight + centerY;
        for (int px = 0; px < regionWidth; px++)
        {
            double x0 = ((startX + px) - canvasWidth / 2.0) * scale / canvasHeight + centerX;

            double x = 0, y = 0;
            int iter = 0;
            while (x * x + y * y <= 4 && iter < maxIter)
            {
                double xt = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xt;
                iter++;
            }

            // Smooth coloring
            double mu = iter;
            if (iter < maxIter)
            {
                double log_zn = log(x * x + y * y) / 2.0;
                double nu = log(log_zn / log(2.0)) / log(2.0);
                mu = iter + 1 - nu;
            }

            double t = mu / maxIter;
            double hue = fmod(360.0 * t + 180.0 * sin(t * 10.0), 360.0);
            double sat = 0.8 + 0.2 * sin(t * 5.0);
            double val = (iter < maxIter) ? 1.0 : 0.0;

            double r, g, b;
            hsvToRgb(hue, sat, val, r, g, b);

            int idx = 4 * (py * regionWidth + px);
            buffer[idx] = static_cast<uint8_t>(r * 255);
            buffer[idx + 1] = static_cast<uint8_t>(g * 255);
            buffer[idx + 2] = static_cast<uint8_t>(b * 255);
            buffer[idx + 3] = 255;
        }
    }

    return emscripten::val(emscripten::typed_memory_view(buffer.size(), buffer.data()));
}

EMSCRIPTEN_BINDINGS(mandelbrot_module)
{
    emscripten::function("computeMandelbrotRegion", &computeMandelbrotRegion);
}
