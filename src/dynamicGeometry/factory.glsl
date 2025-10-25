#version 300 es
precision highp float;

out vec4 fragColor;
uniform float iTime;
uniform vec2 iResolution;
uniform vec3 iColor1; //custom color 1
uniform vec3 iColor2; //custom color 2
uniform float iSpeed; //speed
uniform int iColorScheme; //color scheme selection

// ---------- Helper functions ----------
vec3 palette( in float t)
{
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

    return a*.7 + b*cos( .2*6.283185*(c*t+d) ); //not the same as usual
}

float smin(float a, float b, float k) {
    float h = max(k - abs(a-b), 0.0)/k;
    return min(a,b) - h*h*h*k*(1.0/6.0);
}

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdSphere(vec3 p, float r, vec3 c) {
    return length(p - c) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdOctahedron( vec3 p, float s) {
  p = abs(p);
  return (p.x+p.y+p.z-s)*0.57735027;
}

// ---------- Scene mapping ----------
float mapScene(vec3 p) {
    
    vec3 q = p;
    q.y += iTime * .5 * iSpeed; //move up
    q = mod(q, 2.) - 1.; //repeating space

    float b1 = sdBox(q, vec3(.1, .3, .1));
    
    vec3 q2 = p - vec3(1,0,0);
    q2.y -= iTime * .5 * iSpeed; //move down
    q2 = mod(q2, 2.) - 1.; //repeating space

    float b2 = sdBox(q2, vec3(.1, .3, .1));

    return min(b1, b2);

    // xoxoxo
    // oxoxox
    // xoxoxo

}

// ---------- Main image ----------
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    vec3 rayOrigin = vec3(0.0, 0.0, -3.0);
    vec3 rayDir = normalize(vec3(uv, 1.0));
    vec3 col = vec3(0.0);
    float distTravelled = 0.0;

    // Tilt the ray slightly downward and rotate slowly over time
    float angle = iTime * 0.06 * iSpeed;
    rayDir.yz *= rot2D(0.3);
    rayOrigin.yz *= rot2D(0.3);
    rayDir.xz *= rot2D(angle);
    rayOrigin.xz *= rot2D(angle);

    // Raymarch loop
    int i;
    for(i = 0; i < 80; i++) {
        vec3 p = rayOrigin + rayDir * distTravelled;

        //rotate rays
        //p.xy *= rot2D(distTravelled * .1);

        float d = mapScene(p);
        distTravelled += d;
        if(d < 0.001 || distTravelled > 100.0) break;
    }

    //col = vec3(distTravelled * 0.05); // simple depth coloring

    if (iColorScheme == 1)
        col =  mix(iColor1, iColor2, distTravelled*.1 + float(i) * .015); //color w depth + edges
    else if (iColorScheme == 0)
        col = palette(distTravelled*.1 + float(i) * .015); //color w depth + edges

    fragColor = vec4(col, 1.0);
}

// ---------- Fragment entry ----------
void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
