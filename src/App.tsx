import React, { useEffect, useRef, useState, MouseEvent } from 'react';

interface Grid {
  [key: string]: string;
}

interface Node {
  x: number;
  y: number;
  f: number;
  g: number;
  h: number;
  parent?: Node;
}

const GridCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Grid>({});
  const [start, setStart] = useState<Node | null>(null);
  const [end, setEnd] = useState<Node | null>(null);

  const width = 1024;
  const height = 768;
  const gridSize = 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina scaling to reduce blurriness
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(scale, scale);

    // Function to draw the grid
    const drawGrid = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = '#000000'; // Black grid lines
      ctx.lineWidth = 1;

      // Draw vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw colored squares
      Object.keys(grid).forEach(key => {
        const [col, row] = key.split(',').map(Number);
        ctx.fillStyle = grid[key];
        ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
      });
    };

    // Draw the A* path
    const drawPath = (path: Node[]) => {
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo((path[0].x + 0.5) * gridSize, (path[0].y + 0.5) * gridSize);

      path.forEach(node => {
        ctx.lineTo((node.x + 0.5) * gridSize, (node.y + 0.5) * gridSize);
      });

      ctx.stroke();
    };

    // Initial grid draw
    drawGrid();

    // Draw path if start and end are set
    if (start && end) {
      const path = aStar(start, end, grid);
      drawPath(path);
    }
  }, [grid, start, end]);

  // Heuristic function for A*
  const heuristic = (a: Node, b: Node) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  // A* algorithm
  const aStar = (start: Node, end: Node, grid: Grid): Node[] => {
    const openList: Node[] = [];
    const closedList: Set<string> = new Set();

    openList.push(start);

    while (openList.length > 0) {
      // Sort by f value and get the node with the lowest f value
      openList.sort((a, b) => a.f - b.f);
      const currentNode = openList.shift()!;
      closedList.add(`${currentNode.x},${currentNode.y}`);

      // Reached the goal
      if (currentNode.x === end.x && currentNode.y === end.y) {
        const path: Node[] = [];
        let temp: Node | undefined = currentNode;
        while (temp) {
          path.push(temp);
          temp = temp.parent;
        }
        return path.reverse();
      }

      // Generate neighbors
      const neighbors: Node[] = [
        { x: currentNode.x - 1, y: currentNode.y, f: 0, g: 0, h: 0, parent: currentNode },
        { x: currentNode.x + 1, y: currentNode.y, f: 0, g: 0, h: 0, parent: currentNode },
        { x: currentNode.x, y: currentNode.y - 1, f: 0, g: 0, h: 0, parent: currentNode },
        { x: currentNode.x, y: currentNode.y + 1, f: 0, g: 0, h: 0, parent: currentNode }
      ];

      neighbors.forEach(neighbor => {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        // Skip if it's an obstacle or already closed
        if (grid[neighborKey] === 'red' || closedList.has(neighborKey)) {
          return;
        }

        neighbor.g = currentNode.g + 1;
        neighbor.h = heuristic(neighbor, end);
        neighbor.f = neighbor.g + neighbor.h;

        // Skip if the neighbor is already in the open list with a lower f
        if (openList.some(node => node.x === neighbor.x && node.y === neighbor.y && node.f <= neighbor.f)) {
          return;
        }

        openList.push(neighbor);
      });
    }

    return []; // No path found
  };

  // Handle canvas click to color a square
  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevent context menu on right-click
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const col = Math.floor(x / gridSize);
    const row = Math.floor(y / gridSize);
    const key = `${col},${row}`;

    if (event.type === 'click' && event.button === 0) {
      // Left-click
      if (start && !end) {
        // Set destination
        setGrid(prevGrid => ({
          ...prevGrid,
          [key]: 'green'
        }));
        setEnd({ x: col, y: row, f: 0, g: 0, h: 0 });
      } else if (!start) {
        // Set obstacle
        setGrid(prevGrid => ({
          ...prevGrid,
          [key]: 'red'
        }));
      }
    } else if (event.type === 'contextmenu') {
      // Right-click
      setGrid(prevGrid => ({
        ...prevGrid,
        [key]: 'blue'
      }));
      setStart({ x: col, y: row, f: 0, g: 0, h: 0 });
      setEnd(null); // Reset end point when start is reset
    }
  };

  return <canvas ref={canvasRef} onClick={handleCanvasClick} onContextMenu={handleCanvasClick} />;
};

export default GridCanvas;