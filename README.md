# GitHub Codespaces ♥️ Next.js

Welcome to your shiny new Codespace running Next.js! We've got everything fired up and running for you to explore Next.js.

You've got a blank canvas to work on from a git perspective as well. There's a single initial commit with the what you're seeing right now - where you go from here is up to you!

Everything you do here is contained within this one codespace. There is no repository on GitHub yet. If and when you’re ready you can click "Publish Branch" and we’ll create your repository and push up your project. If you were just exploring then and have no further need for this code then you can simply delete your codespace and it's gone forever.

To run this application:

```
npm run dev
```

## STL File Viewer

This project allows you to upload an STL file and render it using the GPU with Three.js.

### Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

5. Upload an STL file using the file input.

6. The STL file will be rendered using Three.js.

### Error Handling

#### RangeError Exceptions

If a RangeError occurs, it indicates an out-of-bounds access. This can happen if the STL file is malformed or if there is an issue with the file reading process. The application will display an error message indicating the RangeError.

**Resolution Steps:**
1. Verify the integrity of the STL file. Ensure it is not corrupted.
2. Check the file reading process for any potential issues.
3. Ensure the STL file is in binary format, as ASCII STL files are not supported.

#### Out-of-Bounds Access Errors

Out-of-bounds access errors can occur if the application tries to read data outside the bounds of the STL file. This can happen if the file is corrupted or if there is an issue with the file reading process. The application will display an error message indicating the out-of-bounds access error.

**Resolution Steps:**
1. Verify the integrity of the STL file. Ensure it is not corrupted.
2. Check the file reading process for any potential issues.
3. Ensure the STL file is in binary format, as ASCII STL files are not supported.

#### Three.js Initialization Errors

If a Three.js initialization error occurs, it indicates that the browser or device does not support WebGL or there is an issue with the WebGL context creation. The application will display an error message indicating the Three.js initialization error.

**Resolution Steps:**
1. Ensure that your browser supports WebGL. You can check this by visiting [WebGL Report](https://get.webgl.org/).
2. Update your browser to the latest version.
3. Ensure that your graphics drivers are up to date.
4. Try running the application on a different browser or device.

#### Three.js Shader Compilation Errors

If a Three.js shader compilation error occurs, it indicates that there is an issue with the shader code. The application will display an error message indicating the shader compilation error along with the specific error message from the WebGL context.

**Resolution Steps:**
1. Review the shader code for any syntax errors.
2. Ensure that the shader code is compatible with the WebGL implementation.
3. Check the specific error message from the WebGL context for more details.

#### Three.js Program Linking Errors

If a Three.js program linking error occurs, it indicates that there is an issue with linking the vertex and fragment shaders. The application will display an error message indicating the program linking error along with the specific error message from the WebGL context.

**Resolution Steps:**
1. Ensure that the vertex and fragment shaders have matching attribute and uniform names.
2. Review the shader code for any issues that may cause linking errors.
3. Check the specific error message from the WebGL context for more details.

#### STL Parsing Errors

If an STL parsing error occurs, it indicates that there is an issue with parsing the STL file. The application will display an error message indicating the STL parsing error. ASCII STL files are not supported, and the application will display an error message if an ASCII STL file is provided.

**Resolution Steps:**
1. Ensure that the STL file is in binary format, as ASCII STL files are not supported.
2. Verify the integrity of the STL file. Ensure it is not corrupted.
3. Check the file reading process for any potential issues.

### Three.js Functions

This project uses Three.js functions to handle STL file parsing and rendering. The functions include:

- `parseSTL`: Parses the binary STL file and extracts vertices and normals.
- `loadShader`: Loads and compiles a WebGL shader.
- `animate`: Handles the animation loop for rendering the STL file.
