type ParsedOp = {
  type: 'm' | 'p';
  counter: number;
  peerId: string;
  targetId: string;
  parentId?: string;
  key?: string;
  value?: any;
};

self.onmessage = (e: MessageEvent) => {
  const { lines, peerId, requestId } = e.data;
  
  try {
    const operations: ParsedOp[] = [];

    for (const line of lines) {
      if (line.trim()) {
        try {
          // Remove surrounding quotes and null characters if present
          const cleanLine = line.replace(/^"|"$/g, '').replace(/\u0000/g, '');
          const [opType, counter, targetId, ...rest] = JSON.parse(cleanLine);
          
          if (opType === "m" && rest.length === 1) {
            operations.push({
              type: 'm',
              counter,
              peerId,
              targetId,
              parentId: rest[0]
            });
          } else if (opType === "p" && rest.length === 2) {
            operations.push({
              type: 'p',
              counter,
              peerId,
              targetId,
              key: rest[0],
              value: rest[1]
            });
          }
        } catch (error) {
          console.error("Error parsing JSON line:", line, error);
          // Continue processing other lines even if one fails
        }
      }
    }

    self.postMessage({ requestId, operations });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({ requestId, error: errorMessage });
  }
};
