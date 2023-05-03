import { BubbleFilename, ROOT_PATH } from "../src"

const VALID_DIR = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063';
const VALID_FILE = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world.txt';
const VALID_MAX_LENGTH_FILE = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/'+'a'.repeat(255);
const VALID_DIR_NO_PREFIX = '24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063';
const VALID_FILE_NO_PREFIX = '24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world.txt';
const ROOT_PATH_NO_PREFIX = ROOT_PATH.slice(2);

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
    })

    test('with a valid file with path extension', () => {
      const filename = new BubbleFilename(VALID_FILE);
      expect(filename.fullFilename).toBe(VALID_FILE);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(true);
      expect(filename.isDirectory()).toBe(false);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
    })

    test('with the root path', () => {
      const filename = new BubbleFilename(ROOT_PATH);
      expect(filename.fullFilename).toBe(ROOT_PATH);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(true);
      expect(filename.isFile()).toBe(false);
      expect(filename.isDirectory()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(ROOT_PATH);
    })

    test('with a valid file with no path extension (no 0x prefix)', () => {
      const filename = new BubbleFilename(VALID_DIR_NO_PREFIX);
      expect(filename.fullFilename).toBe(VALID_DIR);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(false);
      expect(filename.isDirectory()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
    })

    test('with a valid file with path extension (no 0x prefix)', () => {
      const filename = new BubbleFilename(VALID_FILE_NO_PREFIX);
      expect(filename.fullFilename).toBe(VALID_FILE);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(false);
      expect(filename.isFile()).toBe(true);
      expect(filename.isDirectory()).toBe(false);
      expect(filename.getPermissionedPart()).toBe(VALID_DIR);
    })

    test('with the root path (no 0x prefix)', () => {
      const filename = new BubbleFilename(ROOT_PATH_NO_PREFIX);
      expect(filename.fullFilename).toBe(ROOT_PATH);
      expect(filename.isValid()).toBe(true);
      expect(filename.isRoot()).toBe(true);
      expect(filename.isFile()).toBe(false);
      expect(filename.isDirectory()).toBe(true);
      expect(filename.getPermissionedPart()).toBe(ROOT_PATH);
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
    })

  })  
  
  
  describe('can be constructed but is marked invalid', () => {

    function testInvalidPath(path) {
      const filename = new BubbleFilename(path);
      expect(filename.isValid()).toBe(false);
      expect(filename.fullFilename).toBe(path);
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

  })

})