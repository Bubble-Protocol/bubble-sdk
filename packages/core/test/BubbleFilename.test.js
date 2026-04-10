import { BubbleFilename, BubblePermissions, ROOT_PATH } from "../src"

const VALID_DIR = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063';
const VALID_FILE = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world.txt';
const VALID_MAX_LENGTH_FILE = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/'+'a'.repeat(255);
const VALID_DIR_NO_PREFIX = '24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063';
const VALID_FILE_NO_PREFIX = '24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world.txt';
const ROOT_PATH_NO_PREFIX = ROOT_PATH.slice(2);
const PERMISSIONS_DRW = new BubblePermissions(1n << 254n | 1n << 253n | 1n << 252n);
const PERMISSIONS_DRWA = new BubblePermissions(1n << 254n | 1n << 253n | 1n << 252n | 1n << 251n);
const PERMISSIONS_RW = new BubblePermissions(1n << 253n | 1n << 252n);
const PERMISSIONS_RWA = new BubblePermissions(1n << 253n | 1n << 252n | 1n << 251n);

const VALID_UNICODE_PATH_EXTENSIONS = [
  // ASCII filenames
  "sample.txt",
  "file_name-123.pdf",
  "A_b-C.123",

  // Unicode filenames with various scripts
  "文件.txt", // Chinese
  "файл.pdf", // Cyrillic
  "ファイル.md", // Japanese
  "파일.hwp", // Korean
  "αρχείο.docx", // Greek

  // Mixed ASCII and Unicode characters
  "example_文件.txt",
  "файл_report-2022.pdf",

  // Filenames with special characters
  "file name with spaces.txt",
  "file:name.txt",
  "file?name.txt",
  "file*name.txt",

  // Filenames with leading/trailing spaces
  " file_with_leading_space.txt",
  "file_with_trailing_space.txt ",

  // Filenames with various Unicode normalization forms
  "café.txt", // NFC
  "café.txt" // NFD
];


describe('BubbleFilename', () => {

  describe('can be constructed and is valid', () => {

    test('with a valid file with no path extension', () => {
      const filename = new BubbleFilename(VALID_DIR);
      expect(filename.fullFilename).toBe(VALID_DIR);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(false);
      expect(filename.isDirectory()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
      expect(filename.getFilePart()).toBe(VALID_DIR);
      expect(filename.isChildOf(VALID_DIR)).toBe(false);
    })

    test('with a valid file with path extension', () => {
      const filename = new BubbleFilename(VALID_FILE);
      expect(filename.fullFilename).toBe(VALID_FILE);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(true);
      expect(filename.isDirectory()).toBe(false);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
      expect(filename.getFilePart()).toBe('hello-world.txt');
      expect(filename.isChildOf(VALID_DIR)).toBe(true);
      expect(filename.isChildOf(ROOT_PATH)).toBe(false);
    })

    test('with the root path', () => {
      const filename = new BubbleFilename(ROOT_PATH);
      expect(filename.fullFilename).toBe(ROOT_PATH);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(true);
      expect(filename.isFile()).toBe(false);
      expect(filename.isDirectory()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(ROOT_PATH);
      expect(filename.getFilePart()).toBe(ROOT_PATH);
      expect(filename.isChildOf(ROOT_PATH)).toBe(false);

    })

    test('with a valid file with no path extension (no 0x prefix)', () => {
      const filename = new BubbleFilename(VALID_DIR_NO_PREFIX);
      expect(filename.fullFilename).toBe(VALID_DIR);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(false);
      expect(filename.isDirectory()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
      expect(filename.getFilePart()).toBe(VALID_DIR);
      expect(filename.isChildOf(VALID_DIR)).toBe(false);
    })

    test('with a valid file with path extension (no 0x prefix)', () => {
      const filename = new BubbleFilename(VALID_FILE_NO_PREFIX);
      expect(filename.fullFilename).toBe(VALID_FILE);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(true);
      expect(filename.isDirectory()).toBe(false);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
      expect(filename.getFilePart()).toBe('hello-world.txt');
      expect(filename.isChildOf(VALID_DIR)).toBe(true);
    })

    test('with the root path (no 0x prefix)', () => {
      const filename = new BubbleFilename(ROOT_PATH_NO_PREFIX);
      expect(filename.fullFilename).toBe(ROOT_PATH);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(true);
      expect(filename.isFile()).toBe(false);
      expect(filename.isDirectory()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(ROOT_PATH);
      expect(filename.getFilePart()).toBe(ROOT_PATH);
      expect(filename.isChildOf(ROOT_PATH)).toBe(false);

    })

    test('with valid unicode characters', () => {
      VALID_UNICODE_PATH_EXTENSIONS.forEach(path => {
        const filename = new BubbleFilename(VALID_DIR+'/'+path);
        if (!filename.isValid()) console.log('Unicode found to be invalid: '+path);
        expect(filename.fullFilename).toBe(VALID_DIR+'/'+path);
        expect(filename.isValid()).toBe(true);
        expect(filename.isRoot()).toBe(false);
        expect(filename.isFile()).toBe(true);
        expect(filename.isDirectory()).toBe(false);
        expect(filename.getPermissionedPart()).toBe(VALID_DIR);
        expect(filename.getFilePart()).toBe(path);
        expect(filename.isChildOf(VALID_DIR)).toBe(true);
      })
    })

    test('with a valid maximum length path extension', () => {
      const filename = new BubbleFilename(VALID_MAX_LENGTH_FILE);
      if (!filename.isValid()) console.log('Unicode found to be invalid: '+path);
      expect(filename.fullFilename).toBe(VALID_MAX_LENGTH_FILE);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(true);
      expect(filename.isDirectory()).toBe(false);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
      expect(filename.getFilePart()).toBe('a'.repeat(255));
      expect(filename.isChildOf(VALID_DIR)).toBe(true);
    })

  })  
  
  
  describe('can be constructed but is marked invalid', () => {

    function testInvalidPath(path) {
      const filename = new BubbleFilename(path);
      expect(filename.isValid()).toBe(false);
      expect(filename.fullFilename).toBe(path);
      return filename;
    }
    
    test('with undefined parameter', () => {
      testInvalidPath(undefined);
    })

    test('with empty parameter', () => {
      testInvalidPath('');
    })

    test('with incorrect type of parameter', () => {
      testInvalidPath({});
    })

    test('with a path extension that is too long', () => {
      testInvalidPath(VALID_MAX_LENGTH_FILE+'p');
    })

    test('with a directory part that is too short', () => {
      testInvalidPath(VALID_DIR_NO_PREFIX.slice(1));
    })

    test('with a directory part that is too long', () => {
      testInvalidPath('1'+VALID_DIR_NO_PREFIX);
    })

    test('with a null character in its extension', () => {
      testInvalidPath(VALID_DIR+'/invalid\0extension');
    })

    test('with a missing /', () => {
      testInvalidPath(VALID_DIR+'hello-world.txt');
    })

    test('with more than one /', () => {
      testInvalidPath(VALID_DIR+'/myDir/hello-world.txt');
    })

    test('with an extension > 255 characters', () => {
      testInvalidPath(VALID_DIR+'/myDir/hello-world.txt');
    })

    test('with the reserved . path', () => {
      testInvalidPath(VALID_DIR+'/.');
    })

    test('with the reserved .. path', () => {
      testInvalidPath(VALID_DIR+'/..');
    })

    test('throws when invalid and getters are called', () => {
      const filename = testInvalidPath(VALID_DIR+'/..');
      expect(() => filename.getPermissionedPart()).toThrow();
      expect(() => filename.getFilePart()).toThrow();
      expect(() => filename.isFile()).toThrow();
      expect(() => filename.isDirectory()).toThrow();
      expect(() => filename.isRoot()).toThrow();
    })

  })


  describe("converts permissioned part to lowercase", () => {

    const UPPERCASE_DIR = '0x'+VALID_DIR.slice(2).toUpperCase();
    const LOWERCASE_DIR = '0x'+VALID_DIR.slice(2).toLowerCase();

    test("when a directory", () => {
      const filename = new BubbleFilename(UPPERCASE_DIR);
      expect(filename.isValid()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(LOWERCASE_DIR);
      expect(filename.fullFilename).toBe(LOWERCASE_DIR);
    })
  
    test("when a file in a directory (and does not convert path extension)", () => {
      const filename = new BubbleFilename(UPPERCASE_DIR+'/MyFile.txt');
      expect(filename.isValid()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(LOWERCASE_DIR);
      expect(filename.getFilePart()).toBe('MyFile.txt');
      expect(filename.fullFilename).toBe(LOWERCASE_DIR+'/MyFile.txt');
    })
  
  })


  describe("adds leading '0x'", () => {

    test("when a directory", () => {
      const filename = new BubbleFilename(VALID_DIR.slice(2));
      expect(filename.isValid()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
      expect(filename.fullFilename).toBe(VALID_DIR);
    })
  
    test("when a file in a directory (and does not convert path extension)", () => {
      const filename = new BubbleFilename(VALID_DIR.slice(2)+'/MyFile.txt');
      expect(filename.isValid()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
      expect(filename.getFilePart()).toBe('MyFile.txt');
      expect(filename.fullFilename).toBe(VALID_DIR+'/MyFile.txt');
    })
  
  })


  describe('isChildOf', () => {

    test('returns true when the parameter is a BubbleFilename instance with a matching permissioned part', () => {
      const filename = new BubbleFilename(VALID_FILE);
      const directory = new BubbleFilename(VALID_DIR);
      expect(filename.isChildOf(directory)).toBe(true);
    })

    test('returns true when the parameter is a string matching the permissioned part', () => {
      const filename = new BubbleFilename(VALID_FILE);
      expect(filename.isChildOf(VALID_DIR)).toBe(true);
    })

    test('returns false when the parameter is a string not matching the permissioned part', () => {
      const filename = new BubbleFilename(VALID_FILE);
      expect(filename.isChildOf('0x'+'1'.repeat(64))).toBe(false);
    })

    test('returns false when the parameter is a BubbleFilename instance with a non-matching permissioned part', () => {
      const filename = new BubbleFilename(VALID_FILE);
      const directory = new BubbleFilename('0x'+'1'.repeat(64));
      expect(filename.isChildOf(directory)).toBe(false);
    })

    test('returns false when the parameter is a valid directory but this filename is a directory (and thus not a child)', () => {
      const filename = new BubbleFilename(VALID_DIR);
      const directory = new BubbleFilename(VALID_DIR);
      expect(filename.isChildOf(directory)).toBe(false);
    })

    test('returns true even if the parameter matches but permissions indicate it is not a directory', () => {
      const filename = new BubbleFilename(VALID_FILE);
      const directory = new BubbleFilename(VALID_DIR);
      directory.setPermissions(PERMISSIONS_RW);
      expect(filename.isChildOf(directory)).toBe(true);
    })

    test('returns false when the specified directory is invalid', () => {
      const filename = new BubbleFilename(VALID_DIR+'/child.txt');
      expect(filename.isChildOf('invalid')).toBe(false);
    })

    test('returns false when the filename is invalid', () => {
      const filename = new BubbleFilename('invalid');
      expect(filename.isChildOf(VALID_DIR)).toBe(false);
    })

    test('returns false when the filename and specified directory are invalid', () => {
      const filename = new BubbleFilename('invalid');
      expect(filename.isChildOf('invalid')).toBe(false);
    })

    test('returns false when the parameter is not a string or BubbleFilename instance', () => {
      const filename = new BubbleFilename(VALID_FILE);
      expect(filename.isChildOf({})).toBe(false);
    })

  })


  describe('equals', () => {

    test('returns true for two identical directories', () => {
      const filename1 = new BubbleFilename(VALID_DIR);
      const filename2 = new BubbleFilename(VALID_DIR);
      expect(filename1.equals(filename2)).toBe(true);
    })

    test('returns true for two identical directories when one is a string', () => {
      const filename1 = new BubbleFilename(VALID_DIR);
      expect(filename1.equals(VALID_DIR)).toBe(true);
    })

    test('returns true for two identical valid filenames', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      const filename2 = new BubbleFilename(VALID_FILE);
      expect(filename1.equals(filename2)).toBe(true);
    })

    test('returns true for two identical valid filenames when one is a string', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      expect(filename1.equals(VALID_FILE)).toBe(true);
    })

    test('returns true for two identical filenames even if their permissions differ', () => {
      const filename1 = new BubbleFilename(VALID_DIR);
      const filename2 = new BubbleFilename(VALID_DIR);
      filename1.setPermissions(PERMISSIONS_DRW);
      filename2.setPermissions(PERMISSIONS_DRWA);
      expect(filename1.equals(filename2)).toBe(true);
    })

    test('returns false for two different valid filenames', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      const filename2 = new BubbleFilename(VALID_FILE.replace('hello-world.txt', 'goodbye-world.txt'));
      expect(filename1.equals(filename2)).toBe(false);
    })

    test('returns false for two different valid filenames when one is a string', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      const filename2 = VALID_FILE.replace('hello-world.txt', 'goodbye-world.txt');
      expect(filename1.equals(filename2)).toBe(false);
    })

    test('returns false for two different valid directories', () => {
      const filename1 = new BubbleFilename(VALID_DIR);
      const filename2 = new BubbleFilename(ROOT_PATH);
      expect(filename1.equals(filename2)).toBe(false);
    })

    test('returns false for two different valid directories when one is a string', () => {
      const filename1 = new BubbleFilename(VALID_DIR);
      expect(filename1.equals(ROOT_PATH)).toBe(false);
    })

    test('returns false when the other filename is invalid', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      const filename2 = new BubbleFilename('invalid');
      expect(filename1.equals(filename2)).toBe(false);
    })

    test('returns false when this filename is invalid', () => {
      const filename1 = new BubbleFilename('invalid');
      const filename2 = new BubbleFilename(VALID_FILE);
      expect(filename1.equals(filename2)).toBe(false);
    })

    test('returns false when both filenames are invalid', () => {
      const filename1 = new BubbleFilename('invalid');
      const filename2 = new BubbleFilename('invalid');
      expect(filename1.equals(filename2)).toBe(false);
    })

    test('returns false when the other filename is not a BubbleFilename or string', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      expect(filename1.equals({})).toBe(false);
    })

  })


  describe('deepEquals', () => {

    test('returns true for two identical directories with identical permissions', () => {
      const filename1 = new BubbleFilename(VALID_DIR);
      const filename2 = new BubbleFilename(VALID_DIR);
      filename1.setPermissions(PERMISSIONS_DRW);
      filename2.setPermissions(PERMISSIONS_DRW);
      expect(filename1.deepEquals(filename2)).toBe(true);
    })

    test('returns false for two identical directories with different permissions', () => {
      const filename1 = new BubbleFilename(VALID_DIR);
      const filename2 = new BubbleFilename(VALID_DIR);
      filename1.setPermissions(PERMISSIONS_RW);
      filename2.setPermissions(PERMISSIONS_RWA);
      expect(filename1.deepEquals(filename2)).toBe(false);
    })
    
    test('returns true for two identical valid filenames with identical permissions', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      const filename2 = new BubbleFilename(VALID_FILE);
      filename1.setPermissions(PERMISSIONS_DRW);
      filename2.setPermissions(PERMISSIONS_DRW);
      expect(filename1.deepEquals(filename2)).toBe(true);
    })

    test('returns false for two identical valid filenames with different permissions', () => {
      const filename1 = new BubbleFilename(VALID_FILE);
      const filename2 = new BubbleFilename(VALID_FILE);
      filename1.setPermissions(PERMISSIONS_DRW);
      filename2.setPermissions(PERMISSIONS_DRWA);
      expect(filename1.deepEquals(filename2)).toBe(false);
    })

  })

})