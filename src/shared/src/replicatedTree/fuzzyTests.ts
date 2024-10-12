import { ReplicatedTree } from "./ReplicatedTree";

type RandomAction = 'move' | 'create';

export function fuzzyTest(treesCount: number = 3, tries: number = 10, movesPerTry: number = 1000): ReplicatedTree[] {
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

    randomMoves(trees, movesPerTry);

    // Sync trees
    trees.forEach((tree) => {
      const ops = tree.popLocalOps();
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

function randomMoves(trees: ReplicatedTree[], numMoves: number = 1000) {
  console.log(`Doing ${numMoves} random moves...`);

  // Find a random node in the tree to move
  // Find a random new parent for that node
  // Move the node. We test both for legal and illegal moves

  const chanceOfCreate = 0.025;
  const chanceOfMoveInANonExistingParent = 0.01;

  for (let i = 0; i < numMoves; i++) {
    const action: RandomAction = Math.random() < chanceOfCreate ? 'create' : 'move';

    if (action === 'create') {
      const tree = randomTree(trees);
      tree.newNode(randomNode(tree));
    } else {
      const tree = randomTree(trees);
      const targetChild = randomNode(tree);

      let newParent: string;
      if (Math.random() < chanceOfMoveInANonExistingParent) {
        newParent = Math.random().toString(36).substring(2, 8);
      } else {
        newParent = randomNode(tree);
      }

      tree.move(targetChild, newParent);
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
  const nodes = tree.getAllNodes(); // Assuming you add this method to ReplicatedTree
  const randomIndex = Math.floor(Math.random() * nodes.length);
  return nodes[randomIndex].id;
}

function randomTree(trees: ReplicatedTree[]) {
  return trees[Math.floor(Math.random() * trees.length)];
}