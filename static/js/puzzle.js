// Hold the JavaScript that makes the puzzle work

window.addEventListener("load", () => {
    const canvas = document.getElementById("puzzleCanvas");
    const ctx = canvas.getContext("2d");
  
    // ============================================================
    // Determine Grid Dimensions Based on User Selection
    // ============================================================
    // "numPieces" is defined globally via index.html.
    let chosenPieces = parseInt(numPieces) || 25; // Default to 25 pieces if not set.
  
    let rows, cols;
    // Map specific piece counts to grid dimensions.
    switch (chosenPieces) {
      case 10:
        rows = 2;
        cols = 5;
        break;
      case 25:
        rows = 5;
        cols = 5;
        break;
      case 50:
        rows = 5;
        cols = 10;
        break;
      case 100:
        rows = 10;
        cols = 10;
        break;
      case 250:
        rows = 10;
        cols = 25;
        break;
      case 500:
        rows = 10;
        cols = 50;
        break;
      default:
        // Fallback to a square grid if an unexpected number is provided.
        rows = Math.round(Math.sqrt(chosenPieces));
        cols = Math.ceil(chosenPieces / rows);
    }
  
    // ============================================================
    // Global Variables and Arrays
    // ============================================================
    const pieces = [];
    let origWidth, origHeight;
    let currentScaleFactor;
    let newPieceWidth, newPieceHeight;   // Scaled piece dimensions
    let origPieceWidth, origPieceHeight; // Original piece dimensions (for slicing)
  
    // Timer variable: start time (in milliseconds)
    let startTime;
  
    // ============================================================
    // Edge Generation Helpers (Semi-Random with Inversion)
    // ============================================================
    function randomEdge() {
      return {
        orientation: Math.random() > 0.5 ? 1 : -1,
        depth: 0.8 + Math.random() * 0.4,       // Range: 0.8 - 1.2
        curveFactor: 0.8 + Math.random() * 0.4, // Range: 0.8 - 1.2
        widthVariation: 0.9 + Math.random() * 0.2
      };
    }
  
    function flatEdge() {
      return {
        orientation: 0,
        depth: 0,
        curveFactor: 1,
        widthVariation: 1
      };
    }
  
    function invertEdge(edge) {
      return {
        orientation: -edge.orientation,
        depth: edge.depth,
        curveFactor: edge.curveFactor,
        widthVariation: edge.widthVariation
      };
    }
  
    // ============================================================
    // Image Loading & Scaling
    // ============================================================
    const image = new Image();
    image.src = imageUrl; // Global variable from index.html
  
    image.onload = () => {
      origWidth = image.width;
      origHeight = image.height;
      updateScaling();
      createPieces();
      shufflePieces();
      drawPieces();
      // Start the timer when the puzzle is ready.
      startTime = Date.now();
    };
  
    // Updates canvas size and piece dimensions so the puzzle fits within 90% of the window.
    function updateScaling() {
      const maxCanvasWidth = window.innerWidth * 0.9;
      const maxCanvasHeight = window.innerHeight * 0.9;
      const scaleFactor = Math.min(maxCanvasWidth / origWidth, maxCanvasHeight / origHeight, 1);
      currentScaleFactor = scaleFactor;
      canvas.width = origWidth * scaleFactor;
      canvas.height = origHeight * scaleFactor;
      newPieceWidth = canvas.width / cols;
      newPieceHeight = canvas.height / rows;
      origPieceWidth = origWidth / cols;
      origPieceHeight = origHeight / rows;
    }
  
    // ============================================================
    // Puzzle Piece Creation
    // ============================================================
    function createPieces() {
      pieces.length = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let topEdge = (row === 0) ? flatEdge() : invertEdge(pieces[(row - 1) * cols + col].bottomEdge);
          let leftEdge = (col === 0) ? flatEdge() : invertEdge(pieces[row * cols + (col - 1)].rightEdge);
          let rightEdge = (col === cols - 1) ? flatEdge() : randomEdge();
          let bottomEdge = (row === rows - 1) ? flatEdge() : randomEdge();
  
          pieces.push({
            row: row,
            col: col,
            sx: col * origPieceWidth,
            sy: row * origPieceHeight,
            correctX: col * newPieceWidth,
            correctY: row * newPieceHeight,
            x: col * newPieceWidth,
            y: row * newPieceHeight,
            width: newPieceWidth,
            height: newPieceHeight,
            topEdge: topEdge,
            rightEdge: rightEdge,
            bottomEdge: bottomEdge,
            leftEdge: leftEdge,
            isDragging: false
          });
        }
      }
    }
  
    // ============================================================
    // Shuffle Puzzle Pieces Randomly
    // ============================================================
    function shufflePieces() {
      pieces.forEach(piece => {
        piece.x = Math.random() * (canvas.width - piece.width);
        piece.y = Math.random() * (canvas.height - piece.height);
      });
    }
  
    // ============================================================
    // Drawing the Puzzle Pieces (Single Circular-like Curve per Edge)
    // ============================================================
    function drawPuzzlePiecePath(ctx, x, y, width, height, topEdge, rightEdge, bottomEdge, leftEdge) {
      const baseTabSize = Math.min(width, height) / 5;
      const tabWidth = width / 4;   // For horizontal edges
      const tabHeight = height / 4; // For vertical edges
  
      ctx.beginPath();
      ctx.moveTo(x, y);
  
      // Top Edge
      if (topEdge.orientation === 0) {
        ctx.lineTo(x + width, y);
      } else {
        const effectiveTabSize = baseTabSize * topEdge.depth;
        const sign = topEdge.orientation;
        const A = { x: x + width / 2 - tabWidth, y: y };
        const B = { x: x + width / 2 + tabWidth, y: y };
        const halfChord = tabWidth;
        if (effectiveTabSize === 0) {
          ctx.lineTo(x + width, y);
        } else {
          const R = (effectiveTabSize * effectiveTabSize + halfChord * halfChord) / (2 * effectiveTabSize);
          const alpha = Math.asin(halfChord / R);
          const d = (4 / 3) * Math.tan(alpha / 2) * halfChord;
          ctx.lineTo(A.x, A.y);
          ctx.bezierCurveTo(
            A.x, A.y - sign * d,
            B.x, B.y - sign * d,
            B.x, B.y
          );
          ctx.lineTo(x + width, y);
        }
      }
  
      // Right Edge
      if (rightEdge.orientation === 0) {
        ctx.lineTo(x + width, y + height);
      } else {
        const effectiveTabSize = baseTabSize * rightEdge.depth;
        const sign = rightEdge.orientation;
        const A = { x: x + width, y: y + height / 2 - tabHeight };
        const B = { x: x + width, y: y + height / 2 + tabHeight };
        const halfChord = tabHeight;
        if (effectiveTabSize === 0) {
          ctx.lineTo(x + width, y + height);
        } else {
          const R = (effectiveTabSize * effectiveTabSize + halfChord * halfChord) / (2 * effectiveTabSize);
          const alpha = Math.asin(halfChord / R);
          const d = (4 / 3) * Math.tan(alpha / 2) * halfChord;
          ctx.lineTo(A.x, A.y);
          ctx.bezierCurveTo(
            A.x + sign * d, A.y,
            B.x + sign * d, B.y,
            B.x, B.y
          );
          ctx.lineTo(x + width, y + height);
        }
      }
  
      // Bottom Edge
      if (bottomEdge.orientation === 0) {
        ctx.lineTo(x, y + height);
      } else {
        const effectiveTabSize = baseTabSize * bottomEdge.depth;
        const sign = bottomEdge.orientation;
        const A = { x: x + width / 2 + tabWidth, y: y + height };
        const B = { x: x + width / 2 - tabWidth, y: y + height };
        const halfChord = tabWidth;
        if (effectiveTabSize === 0) {
          ctx.lineTo(x, y + height);
        } else {
          const R = (effectiveTabSize * effectiveTabSize + halfChord * halfChord) / (2 * effectiveTabSize);
          const alpha = Math.asin(halfChord / R);
          const d = (4 / 3) * Math.tan(alpha / 2) * halfChord;
          ctx.lineTo(A.x, A.y);
          ctx.bezierCurveTo(
            A.x, A.y + sign * d,
            B.x, B.y + sign * d,
            B.x, B.y
          );
          ctx.lineTo(x, y + height);
        }
      }
  
      // Left Edge
      if (leftEdge.orientation === 0) {
        ctx.lineTo(x, y);
      } else {
        const effectiveTabSize = baseTabSize * leftEdge.depth;
        const sign = leftEdge.orientation;
        const A = { x: x, y: y + height / 2 + tabHeight };
        const B = { x: x, y: y + height / 2 - tabHeight };
        const halfChord = tabHeight;
        if (effectiveTabSize === 0) {
          ctx.lineTo(x, y);
        } else {
          const R = (effectiveTabSize * effectiveTabSize + halfChord * halfChord) / (2 * effectiveTabSize);
          const alpha = Math.asin(halfChord / R);
          const d = (4 / 3) * Math.tan(alpha / 2) * halfChord;
          ctx.lineTo(A.x, A.y);
          ctx.bezierCurveTo(
            A.x - sign * d, A.y,
            B.x - sign * d, B.y,
            B.x, B.y
          );
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
    }
  
    // ============================================================
    // Drawing the Pieces and Checking for Completion
    // ============================================================
    function drawPieces() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(piece => {
        ctx.save();
        drawPuzzlePiecePath(ctx, piece.x, piece.y, piece.width, piece.height,
          piece.topEdge, piece.rightEdge, piece.bottomEdge, piece.leftEdge);
        ctx.clip();
  
        const extra = Math.min(piece.width, piece.height) / 4;
        ctx.drawImage(
          image,
          piece.sx - extra, piece.sy - extra, origPieceWidth + 2 * extra, origPieceHeight + 2 * extra,
          piece.x - extra, piece.y - extra, piece.width + 2 * extra, piece.height + 2 * extra
        );
        ctx.restore();
  
        ctx.save();
        ctx.beginPath();
        drawPuzzlePiecePath(ctx, piece.x, piece.y, piece.width, piece.height,
          piece.topEdge, piece.rightEdge, piece.bottomEdge, piece.leftEdge);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
      checkPuzzleComplete();
    }
  
    // ============================================================
    // Puzzle Completion Check & Timer Display
    // ============================================================
    function checkPuzzleComplete() {
      // Puzzle is complete if every piece is exactly at its correct position.
      let complete = pieces.every(piece => piece.x === piece.correctX && piece.y === piece.correctY);
      if (complete) {
        let elapsedTime = Date.now() - startTime; // elapsed time in milliseconds
        let seconds = (elapsedTime / 1000).toFixed(1);
        // Announce completion: update the "result" element and optionally alert.
        document.getElementById('result').innerText = "Congratulations! Puzzle completed in " + seconds + " seconds.";
        alert("Congratulations! Puzzle completed in " + seconds + " seconds.");
      }
    }
  
    // ============================================================
    // Drag-and-Drop Logic
    // ============================================================
    let selectedPiece = null;
    let offsetX, offsetY;
  
    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      for (let i = pieces.length - 1; i >= 0; i--) {
        let piece = pieces[i];
        if (mouseX > piece.x && mouseX < piece.x + piece.width &&
            mouseY > piece.y && mouseY < piece.y + piece.height) {
          selectedPiece = piece;
          offsetX = mouseX - piece.x;
          offsetY = mouseY - piece.y;
          piece.isDragging = true;
          pieces.splice(i, 1);
          pieces.push(piece);
          break;
        }
      }
    });
  
    canvas.addEventListener("mousemove", (e) => {
      if (!selectedPiece) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (selectedPiece.isDragging) {
        selectedPiece.x = mouseX - offsetX;
        selectedPiece.y = mouseY - offsetY;
        drawPieces();
      }
    });
  
    canvas.addEventListener("mouseup", () => {
      if (selectedPiece) {
        selectedPiece.isDragging = false;
        if (Math.abs(selectedPiece.x - selectedPiece.correctX) < 20 &&
            Math.abs(selectedPiece.y - selectedPiece.correctY) < 20) {
          selectedPiece.x = selectedPiece.correctX;
          selectedPiece.y = selectedPiece.correctY;
        }
        selectedPiece = null;
        drawPieces();
      }
    });
  
    canvas.addEventListener("mouseleave", () => {
      if (selectedPiece) {
        selectedPiece.isDragging = false;
        selectedPiece = null;
        drawPieces();
      }
    });
  
    // ============================================================
    // Auto-Resize Handling
    // ============================================================
    window.addEventListener("resize", () => {
      const maxCanvasWidth = window.innerWidth * 0.9;
      const maxCanvasHeight = window.innerHeight * 0.9;
      const newScaleFactor = Math.min(maxCanvasWidth / origWidth, maxCanvasHeight / origHeight, 1);
      const scaleRatio = newScaleFactor / currentScaleFactor;
      canvas.width = origWidth * newScaleFactor;
      canvas.height = origHeight * newScaleFactor;
      newPieceWidth = canvas.width / cols;
      newPieceHeight = canvas.height / rows;
      pieces.forEach(piece => {
        piece.x *= scaleRatio;
        piece.y *= scaleRatio;
        piece.width = newPieceWidth;
        piece.height = newPieceHeight;
        piece.correctX = piece.col * newPieceWidth;
        piece.correctY = piece.row * newPieceHeight;
      });
      currentScaleFactor = newScaleFactor;
      drawPieces();
    });
  });
  
  
  
  