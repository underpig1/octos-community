#version 300 es
precision highp float;

out vec4 fragColor;
uniform float iTime;
uniform vec2 iResolution;
uniform vec4 iMouse;
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

    return a*.7 + b*cos( .5*6.283185*(c*t+d) ); //not the same as usual
}

vec3 gradientLoop(vec3 color1, vec3 color2, float t) {
    // Wrap t to [0,1]
    float tt = mod(t, 1.0);

    // Ping-pong for back-and-forth gradient
    tt = tt < 0.5 ? tt * 2.0 : (1.0 - tt) * 2.0;

    return mix(color1, color2, tt);
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

vec3 rot3D(vec3 p, vec3 axis, float angle) {
    return mix(dot(axis, p) * axis, p, cos(angle)) + cross(axis, p) * sin(angle);
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
    q.z += iTime * 0.5 * iSpeed; //move forward
    q.xy = mod(q.xy, 2.) - 1.; //repeating space
    q.z = mod(q.z, .3) - .15; //repeating space

    float o1 = sdOctahedron(q, .25);
    
    return min(100., o1);
}

// ---------- Main image ----------
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    //vec2 mouse = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;

    vec3 rayOrigin = vec3(0.0, 0.0, -3.0);
    vec3 rayDir = normalize(vec3(uv.xy, 1.0));
    vec3 col = vec3(0.0);
    float distTravelled = 0.0;

    //roll over time
    //rayDir.xy *= rot2D(iTime*-.1);

    // Camera rotation
    // rayOrigin.yz *= rot2D(-mouse.y);
    // rayDir.yz *= rot2D(-mouse.y);
    // rayOrigin.xz *= rot2D(-mouse.x);
    // rayDir.xz *= rot2D(-mouse.x);

    // Raymarch loop
    int i;
    for(i = 0; i < 80; i++) {
        vec3 p = rayOrigin + rayDir * distTravelled;

        //rotate rays
        p.xy *= rot2D(distTravelled * .1 * sin(distTravelled) * .1);

        // compute an incremental bend angle that grows with distance
        float bend = pow(distTravelled / 10.0, 2.0) * 0.08; // tweak 0.05 for strength
        // choose a horizontal bending axis
        //vec3 axis = vec3(sin(iTime), cos(iTime), 0.0);
        //vec3 axis = vec3(0.0, 0.0, 5.0);
        //vec3 axis = normalize(cross(rayDir, vec3(0,0,sin(iTime)))); //cool but instant flips
        vec3 axis = normalize(cross(rayDir, vec3(0,0,1)));
        //vec3 axis = normalize(cross(rayDir, vec3(sin(iTime*.2+1.),cos(iTime*.2+1.),0)));
        // rotate the point around the axis
        p = rot3D(p, axis, bend);


        float d = mapScene(p);
        distTravelled += d;
        if(d < 0.001 || distTravelled > 25.0) break;
    }

    //col = vec3(distTravelled * 0.05); // simple depth coloring
    //col = palette(distTravelled*.1 + float(i) * .015); //color w depth + edge
    vec3 c1 = vec3(1.0, 0.0, 1.0); // magenta
    vec3 c2 = vec3(0.0, 1.0, 1.0); // cyan

    if(iColorScheme == 1) //custom colors
        col = mix(iColor1, iColor2, distTravelled*.1 + float(i) * .015); //color w depth + edges
    else if(iColorScheme == 0) //custom gradient loop
        col = gradientLoop(c1, c2, distTravelled*.02 + float(i) * .005);
    
    fragColor = vec4(col, 1.0);
}

// ---------- Fragment entry ----------
void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
