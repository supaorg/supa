export class OpId {
  constructor(
    readonly counter: number,
    readonly peerId: string
  ) { }

  static compare(opIdA: OpId | string, opIdB: OpId | string): number {
    if (!(opIdA instanceof OpId)) {
      const parsedA = OpId.tryParseStr(opIdA);
      if (!parsedA) throw new Error(`Invalid OpId string: ${opIdA}`);
      opIdA = parsedA;
    }
    if (!(opIdB instanceof OpId)) {
      const parsedB = OpId.tryParseStr(opIdB);
      if (!parsedB) throw new Error(`Invalid OpId string: ${opIdB}`);
      opIdB = parsedB;
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

  static tryParseStr(opIdStr: string): OpId {
    const parts = opIdStr.split('@');

    if (parts.length !== 2) {
      throw new Error(`Invalid OpId string: ${opIdStr}`);
    }

    return new OpId(parseInt(parts[0], 10), parts[1]);
  }
  
  isGreaterThan(opId: OpId | string): boolean {
    return OpId.compare(this, opId) === 1;
  }

  toString(): string {
    return `${this.counter}@${this.peerId}`;
  }
}
