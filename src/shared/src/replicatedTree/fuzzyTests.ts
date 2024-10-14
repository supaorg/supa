import { ReplicatedTree } from "./ReplicatedTree";

type RandomAction = 'move' | 'create' | 'setProperty';

export function fuzzyTest(treesCount: number = 3, tries: number = 10, movesPerTry: number = 1000, randomShuffle: boolean = false): ReplicatedTree[] {
  if (treesCount < 2) {
    throw new Error("treesCount must be at least 2");
  }

  const trees: ReplicatedTree[] = [];

  trees[0] = new ReplicatedTree("peer1");
  for (let i = 1; i < treesCount; i++) {
    trees[i] = new ReplicatedTree(`peer${i + 1}`, trees[0].getMoveOps());
  }

  for (let i = 0; i < tries; i++) {
    console.log(`🧪 Starting try ${i + 1}...`);

    randomMovesAndProps(trees, movesPerTry);

    // Sync trees
    trees.forEach((tree) => {
      const ops = tree.popLocalOps();

      if (randomShuffle) {
        ops.sort(() => Math.random() - 0.5);
      }

      trees.forEach((t) => {
        if (t.peerId !== tree.peerId) {
          t.merge(ops);
        }
      });
    });

    if (!compareTrees(trees)) {
      throw new Error("Trees are not equal!");
    }

    console.log("✅ Trees are equal");
  }

  return trees;
}

function randomMovesAndProps(trees: ReplicatedTree[], numMoves: number = 1000) {
  console.log(`Doing ${numMoves} random moves...`);

  // Find a random node in the tree to move
  // Find a random new parent for that node
  // Move the node. We test both for legal and illegal moves

  const actions: Array<{ action: RandomAction; weight: number }> = [
    { action: 'create', weight: 0.025 },
    { action: 'move', weight: 0.925 },
    { action: 'setProperty', weight: 0.05 }
  ];
  const totalWeight = actions.reduce((sum, { weight }) => sum + weight, 0);

  for (let i = 0; i < numMoves; i++) {
    const randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    const selectedAction = actions.find(({ weight }) => {
      cumulativeWeight += weight;
      return randomValue < cumulativeWeight;
    })?.action || 'move'; // Default to 'move' if nothing is selected

    const tree = randomTree(trees);

    switch (selectedAction) {
      case 'create':
        tree.newNode(randomNode(tree));
        break;
      case 'move':
        const targetChild = randomNode(tree);
        const chanceOfMoveInANonExistingParent = 0.01;
        const newParent = Math.random() < chanceOfMoveInANonExistingParent ? Math.random().toString(36).substring(2, 8) : randomNode(tree);
        tree.move(targetChild, newParent);
        break;
      case 'setProperty':
        // Implement setProperty logic here
        const node = randomNode(tree);
        const randomNum = Math.floor(Math.random() * 100);
        tree.setNodeProperty(node, "test", randomNum);
        break;
    }
  }
}

function compareTrees(trees: ReplicatedTree[]): boolean {
  const firstTree = trees[0];

  console.log(`🚀 Comparing ${trees.length} trees...`);

  let allGood = true;

  const haveEqualMoveOps = trees.every((tree) => firstTree.compareMoveOps(tree));
  if (!haveEqualMoveOps) {
    console.error("❌ Trees have different move ops!");
    allGood = false;
  }

  const haveEqualStructure = trees.every((tree) => firstTree.compareStructure(tree));
  if (!haveEqualStructure) {
    console.error("❌ Trees are not equal!");
    allGood = false;
  }

  return allGood;
}

function randomNode(tree: ReplicatedTree) {
  const nodes = tree.getAllNodes();
  const randomIndex = Math.floor(Math.random() * nodes.length);
  return nodes[randomIndex].id;
}

function randomTree(trees: ReplicatedTree[]) {
  return trees[Math.floor(Math.random() * trees.length)];
}