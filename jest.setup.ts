import '@testing-library/jest-dom';

// Mock window.fetch for tests
global.fetch = jest.fn();

// Mock DOMParser for SVG processing
class MockDOMParser {
  parseFromString(text: string, type: string) {
    // Return a mock document for testing
    const mockDoc = {
      querySelector: jest.fn().mockReturnValue(null),
      querySelectorAll: jest.fn().mockReturnValue([]),
    };
    return mockDoc;
  }
}
global.DOMParser = MockDOMParser as any;

// Mock XMLSerializer for SVG serialization
class MockXMLSerializer {
  serializeToString() {
    return '<svg></svg>';
  }
}
global.XMLSerializer = MockXMLSerializer as any;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
