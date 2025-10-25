#version 300 es
precision highp float;

out vec4 fragColor;
uniform float iTime;
uniform vec2 iResolution;
uniform vec4 iMouse;
uniform float iBrightness;
uniform vec3 iColor;
uniform int iComplexity;
uniform float iVar1;
uniform float iVar2;
uniform int iColorScheme;

// ---------- Helper functions ----------
vec3 palette(float t) {
    // vec3 a = vec3(0.710, 0.710, 0.710);
    // vec3 b = vec3(0.660, 0.660, 0.660);
    // vec3 c = vec3(0.430, 0.430, 0.430);
    // vec3 d = vec3(0.838, 1.172, 1.505);

    // vec3 a = vec3(0.800, 0.800, 0.800);
    // vec3 b = vec3(0.350, 0.350, 0.350);
    // vec3 c = vec3(0.460, 0.460, 0.460);
    // vec3 d = vec3(-0.392, -0.058, 0.275);

    // vec3 a = vec3(0.500, 0.500, 0.500);
    // vec3 b = vec3(0.500, 0.500, 0.500);
    // vec3 c = vec3(0.100, 0.100, 0.100);
    // vec3 d = vec3(1.088, 1.422, 1.755);

    vec3 a = vec3(0.500, 0.500, 0.500);
    vec3 b = vec3(0.500, 0.500, 0.500);
    vec3 c = vec3(0.270, 0.270, 0.270);
    vec3 d = vec3(0.000, 0.333, 0.667);

    // vec3 a = vec3(0.950, 0.012, 0.363);
    // vec3 b = vec3(0.069, 0.669, 0.794);
    // vec3 c = vec3(0.838, 0.961, 1.550);
    // vec3 d = vec3(1.290, 4.215, 5.449);

    return a + b*cos( 6.283185*(c*t+d) );
} // use https://dev.thi.ng/gradients/ to visualize, half freq or smthn??

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// ---------- Main image ----------
void mainImage(out vec4 fragColor, in vec2 fragCoord) {

    float BRIGHTNESS = iBrightness;
    int COMPLEXITY = iComplexity;
    float VAR1 = iVar1;
    float VAR2 = iVar2;
    vec3 COLOR = iColor;
    int COLORSCHEME = iColorScheme;
    // BRIGHTNESS = 1.0; //0 to 1
    // COMPLEXITY = 2; //1 to 5
    // VAR1 = 1.3; //0 to 2
    // VAR2 = .5; //0 to 1
    // COLOR = vec3(.3, .6, .9);
    // COLORSCHEME = 0; //0 to 1, 0 for custom, 1 for rainbow

    //credit to kishimisu on YouTube for basic setup

    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalCol = vec3(0);

    for (int i=0; i < COMPLEXITY; i++) {
        uv = fract(uv * VAR1)-.5;

        float a = length(uv0);
        float d = length(uv);
        d *= 1./(a+ VAR2); 
        vec3 col = COLOR;
        if (COLORSCHEME == 1) {
            col = palette(length(uv0) + float(i)*.4 + iTime*.4);
        }

        //d = sin(d*8. + iTime)/8.;
        d = sin(d*8. + iTime)/8. + cos(d*3. + iTime)/3.;
        d = abs(d/2.);

        d = pow(.02/d, 1.5);
        
        finalCol += col * d;
    
    }

    if (finalCol.r > 1.) finalCol.r = 1.;
    if (finalCol.g > 1.) finalCol.g = 1.;
    if (finalCol.b > 1.) finalCol.b = 1.;
    finalCol.r = pow(finalCol.r, 1.2) * BRIGHTNESS;
    finalCol.g = pow(finalCol.g, 1.2) * BRIGHTNESS;
    finalCol.b = pow(finalCol.b, 1.2) * BRIGHTNESS;

    fragColor = vec4(finalCol, 1.0);

}

// ---------- Fragment entry ----------
void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
