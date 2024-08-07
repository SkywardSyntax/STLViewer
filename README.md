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

### Click and Drag Functionality

To rotate the STL file, click and drag on the canvas. The rotation will be updated based on the mouse movement.

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

### Optimizations

The rendering of the STL file has been further optimized by implementing additional techniques and improvements:

1. **Instancing**: Implemented instancing to reduce the number of draw calls. This technique allows multiple instances of the same geometry to be rendered with a single draw call, improving performance.

2. **Efficient Data Structures and Algorithms**: Used more efficient data structures and algorithms for handling large STL files. This helps in reducing memory usage and improving the overall performance of the application.

3. **Web Workers**: Utilized Web Workers to offload heavy computations from the main thread. This ensures that the main thread remains responsive and improves the performance of the application.

4. **GPU-based Techniques**: Implemented GPU-based techniques like WebGL shaders for more efficient rendering. This allows for better utilization of the GPU and improves the rendering performance.

These optimizations have significantly improved the performance of the STL file rendering, making the application more efficient and responsive.

### Performance Factor Slider

The application now includes a performance factor slider that allows users to dynamically adjust the performance settings. This slider can be used to balance between rendering quality and performance based on the user's preference.

**Instructions for Using the Performance Factor Slider:**

1. Locate the performance factor slider on the application interface.
2. Adjust the slider to the desired performance level. The slider ranges from 0.1 to 1, with 0.1 being the lowest performance setting and 1 being the highest.
3. The application will automatically adjust the rendering settings based on the selected performance factor.

**Benefits of the Performance Optimizations:**

1. **Improved Rendering Speed**: The performance optimizations, including lazy loading, memoization, and Web Workers, significantly improve the rendering speed of the STL files.
2. **Reduced Main Thread Load**: By offloading heavy computations to Web Workers, the main thread remains responsive, resulting in a smoother user experience.
3. **Dynamic Performance Adjustment**: The performance factor slider allows users to dynamically adjust the performance settings based on their preferences and device capabilities.
4. **Efficient Resource Utilization**: The optimizations ensure efficient utilization of system resources, including CPU and GPU, leading to better overall performance.

### Chunking Logic for STL Rendering

The application now includes chunking logic for STL rendering, which processes and renders the STL file in chunks every frame. This approach improves the rendering performance and allows for smoother visualization of large STL files.

**Instructions for Using the Chunking Logic:**

1. Upload an STL file using the file input.
2. The application will automatically process and render the STL file in chunks every frame.
3. The chunking logic ensures that the rendering process remains responsive and efficient, even for large STL files.

**Benefits of the Chunking Logic:**

1. **Improved Rendering Performance**: The chunking logic processes and renders the STL file in smaller chunks, reducing the load on the main thread and improving the overall rendering performance.
2. **Smoother Visualization**: By rendering the STL file in chunks every frame, the application provides a smoother visualization experience, especially for large STL files.
3. **Efficient Resource Utilization**: The chunking logic ensures efficient utilization of system resources, including CPU and GPU, leading to better overall performance.

### Dark Mode Feature

The application now includes a dark mode feature that allows users to switch between light and dark themes. This feature enhances the user experience, especially in low-light environments.

**Instructions for Enabling Dark Mode:**

1. Locate the toggle switch on the application interface.
2. Click the toggle switch to enable dark mode. The application will switch to a dark theme.
3. Click the toggle switch again to disable dark mode and switch back to the light theme.

**Benefits of Dark Mode:**

1. **Reduced Eye Strain**: Dark mode reduces eye strain, especially in low-light environments, making it more comfortable to use the application for extended periods.
2. **Improved Battery Life**: On devices with OLED or AMOLED screens, dark mode can help save battery life by reducing the amount of power needed to display dark pixels.
3. **Enhanced Visual Appeal**: Dark mode provides a sleek and modern look to the application, enhancing its visual appeal.

### ToggleSwitch Component

The `ToggleSwitch` component is a reusable UI element that allows users to toggle between two states, such as enabling or disabling dark mode.

**Usage Instructions:**

1. Import the `ToggleSwitch` component into your desired file:
   ```javascript
   import ToggleSwitch from '../components/ToggleSwitch';
   ```

2. Use the `ToggleSwitch` component in your JSX code:
   ```jsx
   <ToggleSwitch onToggle={handleDarkModeToggle} />
   ```

3. Implement the `handleDarkModeToggle` function to handle the toggle state change:
   ```javascript
   const handleDarkModeToggle = (isOn) => {
     setIsDarkMode(isOn);
     document.body.classList.toggle('dark-mode', isOn);
   };
   ```

**Benefits of the ToggleSwitch Component:**

1. **Reusability**: The `ToggleSwitch` component can be reused in different parts of the application, promoting code reusability and consistency.
2. **Customizability**: The component can be easily customized to fit the application's design and requirements.
3. **User-Friendly**: The toggle switch provides a user-friendly way to enable or disable features, enhancing the overall user experience.
