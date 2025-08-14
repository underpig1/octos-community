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
        r = x;
        g = 0;
        b = c;
    }
    r += m;
    g += m;
    b += m;
}

// Compute Mandelbrot with smooth coloring
emscripten::val computeMandelbrot(int width, int height, double centerX, double centerY, double scale, int maxIter)
{
    std::vector<uint8_t> buffer(width * height * 4);

    for (int py = 0; py < height; py++)
    {
        double y0 = (height / 2.0 - py) * scale / height + centerY;
        for (int px = 0; px < width; px++)
        {
            double x0 = (px - width / 2.0) * scale / height + centerX;

            double x = 0, y = 0;
            int iter = 0;
            while (x * x + y * y <= 4 && iter < maxIter)
            {
                double xt = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xt;
                iter++;
            }

            // Smooth escape time
            double mu = iter;
            if (iter < maxIter)
            {
                double log_zn = log(x * x + y * y) / 2.0;
                double nu = log(log_zn / log(2.0)) / log(2.0);
                mu = iter + 1 - nu;
            }

            // Smooth gradient (sin/cos for interpolation)
            double t = mu / maxIter;
            double hue = fmod(360.0 * t + 180 * sin(t * 10.0), 360.0); // adds subtle waves
            double sat = 0.8 + 0.2 * sin(t * 5.0);
            double val = (iter < maxIter) ? 1.0 : 0.0;

            double r, g, b;
            hsvToRgb(hue, sat, val, r, g, b);

            int idx = 4 * (py * width + px);
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
    emscripten::function("computeMandelbrot", &computeMandelbrot);
}
