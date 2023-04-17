import { HealthCheckItem } from '@models/Health/HealthCheckItem';

describe('When a health check object created', () => {
  describe('and parameters are valid', () => {
    it('parses it correctly', () => {
      const testCase =
        '{"name":"PSQL connection","status":"green","details":"Successfully connected to PSQL","properties":{}}';
      const result = new HealthCheckItem(testCase);
      expect(result.isValid).toBeTruthy();
    });
  });

  describe('and data are invalid', () => {
    const testCases = ['asdf', undefined, '', null, '1'];
    it.each(testCases)('fails gracefully', (testCase) => {
      const result = new HealthCheckItem(testCase as string);
      expect(result.isValid).toBeFalsy();
    });
  });
});
