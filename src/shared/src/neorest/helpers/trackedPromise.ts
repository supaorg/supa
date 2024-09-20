export class TrackedPromise<T> {
  private _original: Promise<T> | T;
  private _promise: Promise<T>;
  private _isPending: boolean = true;
  private _isFulfilled: boolean = false;
  private _isRejected: boolean = false;

  constructor(promiseOrValue: Promise<T> | T) {
    this._original = promiseOrValue;

    if (promiseOrValue instanceof Promise) {
      this._promise = new Promise<T>((resolve, reject) => {
        promiseOrValue.then(
          (value) => {
            this._isPending = false;
            this._isFulfilled = true;
            resolve(value);
          },
          (reason) => {
            this._isPending = false;
            this._isRejected = true;
            reject(reason);
          }
        );
      });
    } else {
      this._isPending = false;
      this._isFulfilled = true;
      this._promise = Promise.resolve(promiseOrValue);
    }
  }

  getOriginal(): Promise<T> | T {
    return this._original;
  }

  get isPending(): boolean {
    return this._isPending;
  }

  get isFulfilled(): boolean {
    return this._isFulfilled;
  }

  get isRejected(): boolean {
    return this._isRejected;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this._promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this._promise.finally(onfinally);
  }
}