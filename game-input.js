// game-input.js - Utility helper functions for input coordinate mapping under zoom/pan
export function getGridCoordinatesFromClient(clientX, clientY, canvas, cameraX, cameraY, cameraZoom, cols, rows) {
    const rect = canvas.getBoundingClientRect();
    
    // Scale factor between internal canvas buffer and displayed client bounding rect size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Convert screen client coordinates to canvas internal pixel space
    const canvasCssX = (clientX - rect.left) * scaleX;
    const canvasCssY = (clientY - rect.top) * scaleY;

    // Map through camera transform (inverse translation and zoom)
    const worldX = (canvasCssX - cameraX) / cameraZoom;
    const worldY = (canvasCssY - cameraY) / cameraZoom;

    let cellSize = canvas.width / cols;
    let clickedCol = Math.floor(worldX / cellSize);
    let clickedRow = Math.floor(worldY / cellSize);

    if (clickedCol < 0 || clickedCol >= cols || clickedRow < 0 || clickedRow >= rows) {
        return null;
    }

    // Direct absolute grid position returning without team flipping/inversion
    return { col: clickedCol, row: clickedRow };
}