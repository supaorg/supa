export class OpId {
  constructor(
    readonly counter: number,
    readonly peerId: string
  ) {}

  static compare(opIdA: OpId | string, opIdB: OpId | string): number {
    if (!(opIdA instanceof OpId)) {
      opIdA = OpId.tryParseStr(opIdA) || OpId.root();
    }
    if (!(opIdB instanceof OpId)) {
      opIdB = OpId.tryParseStr(opIdB) || OpId.root();
    }

    const counterA = opIdA.counter;
    const counterB = opIdB.counter;

    if (counterA > counterB) {
      return 1;
    } else if (counterA < counterB) {
      return -1;
    } else {
      return opIdA.peerId.localeCompare(opIdB.peerId);
    }
  }

  static equals(opIdA: OpId | string | null, opIdB: OpId | string | null): boolean {
    if (opIdA === opIdB) {
      return true;
    } else if (!opIdA || !opIdB) {
      return false;
    }

    return OpId.compare(opIdA, opIdB) === 0;
  }

  static tryParseStr(opIdStr: string | null): OpId | null {
    if (!opIdStr) {
      return null;
    }

    if (opIdStr === 'root') {
      return OpId.root();
    }

    const parts = opIdStr.split('@');

    if (parts.length !== 2) {
      return null;
    }

    return new OpId(parseInt(parts[0], 10), parts[1]);
  }

  static root(): OpId {
    return new OpId(0, '');
  }

  isRoot(): boolean {
    return this.peerId === '' && this.counter === 0;
  }

  isGreaterThan(opId: OpId | string): boolean {
    return OpId.compare(this, opId) === 1;
  }

  toString(): string {
    if (this.isRoot()) {
      return 'root';
    }
    return `${this.counter}@${this.peerId}`;
  }
}
