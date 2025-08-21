/**
 * @jest-environment node
 */

describe('Simple Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });

  it('should test array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should test object matching', () => {
    const obj = { name: 'FoodGuard', type: 'app' };
    expect(obj).toEqual({ name: 'FoodGuard', type: 'app' });
    expect(obj).toHaveProperty('name', 'FoodGuard');
  });
});