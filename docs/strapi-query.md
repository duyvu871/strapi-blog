## 📖 Table of contents

1. [API Reference](#-api-reference)
2. [Resource Managers](#-resource-managers)
   - [`.collection()`](#collectionresource)
   - [`.single()`](#singleresource)
   - [`.files`](#files)

## 🛠 Getting started

## 📚 API Reference

The Strapi client library instance provides key properties and utility methods for content and API interaction:

- **`baseURL`**: base URL of your Strapi backend.
- **`fetch`**: perform generic requests to the Strapi Content API using fetch-like syntax.
- **`.collection(resource: string)`**: get a manager instance for handling collection-type resources.
- **`.single(resource: string)`**: get a manager instance for handling single-type resources.

## 📁 Resource Managers

### `.collection(resource)`

The `.collection()` method provides a manager for working with collection-type resources,
which can have multiple entries.

**Note**: the `resource` corresponds to the plural name of your collection type, as defined in the Strapi model.

#### Available Methods:

1. **`find(queryParams?)`**: fetch multiple entries.
2. **`findOne(documentID, queryParams?)`**: fetch a single entry by its ID.
3. **`create(data, queryParams?)`**: create a new entry.
4. **`update(documentID, data, queryParams?)`**: update an existing entry.
5. **`delete(documentID, queryParams?)`**: remove an entry.

#### Examples:

```typescript
const articles = client.collection('articles');

// Fetch all english articles sorted by title
const allArticles = await articles.find({
  locale: 'en',
  sort: 'title',
});

// Fetch a single article
const singleArticle = await articles.findOne('article-document-id');

// Create a new article
const newArticle = await articles.create({ title: 'New Article', content: '...' });

// Update an existing article
const updatedArticle = await articles.update('article-document-id', { title: 'Updated Title' });

// Delete an article
await articles.delete('article-id');
```

### `.single(resource)`

The `.single()` method provides a manager for working with single-type resources, which have only one entry.

**Note**: the `resource` corresponds to the singular name of your collection type, as defined in the Strapi model.

#### Available Methods:

1. **`find(queryParams?)`**: fetch the document.
2. **`update(data, queryParams?)`**: update the document.
3. **`delete(queryParams?)`**: remove the document.

#### Examples:

```typescript
const homepage = client.single('homepage');

// Fetch the default version of the homepage
const defaultHomepage = await homepage.find();

// Fetch the spanish version of the homepage
const spanishHomepage = await homepage.find({ locale: 'es' });

// Update the homepage draft content
const updatedHomepage = await homepage.update(
  { title: 'Updated Homepage Title' },
  { status: 'draft' }
);

// Delete the homepage content
await homepage.delete();
```

### .files

The `files` property provides access to the Strapi Media Library through the Upload plugin. It allows you to retrieve files metadata without directly interacting with the REST API.

#### Methods

- `find(params?: FileQueryParams): Promise<FileListResponse>` - Retrieves a list of file metadata based on optional query parameters
- `findOne(fileId: number): Promise<FileResponse>` - Retrieves the metadata for a single file by its ID
- `update(fileId: number, fileInfo: FileUpdateData): Promise<FileResponse>` - Updates metadata for an existing file
- `delete(fileId: number): Promise<void>` - Deletes a file by its ID

#### Example: Finding Files

```typescript
// Initialize the client
const client = strapi({
  baseURL: 'http://localhost:1337/api',
  auth: 'your-api-token',
});

// Find all file metadata
const allFiles = await client.files.find();
console.log(allFiles);

// Find file metadata with filtering and sorting
const imageFiles = await client.files.find({
  filters: {
    mime: { $contains: 'image' }, // Only get image files
    name: { $contains: 'avatar' }, // Only get files with 'avatar' in the name
  },
  sort: ['name:asc'], // Sort by name in ascending order
});
```

#### Example: Finding a Single File

```typescript
// Initialize the client
const client = strapi({
  baseURL: 'http://localhost:1337/api',
  auth: 'your-api-token',
});

// Find file metadata by ID
const file = await client.files.findOne(1);

console.log(file.name); // The file name
console.log(file.url); // The file URL
console.log(file.mime); // The file MIME type
```

#### Example: Updating File Metadata

```typescript
// Initialize the client
const client = strapi({
  baseURL: 'http://localhost:1337/api',
  auth: 'your-api-token',
});

// Update file metadata
const updatedFile = await client.files.update(1, {
  name: 'New file name',
  alternativeText: 'Descriptive alt text for accessibility',
  caption: 'A caption for the file',
});

console.log(updatedFile.name); // Updated file name
console.log(updatedFile.alternativeText); // Updated alt text
```

#### Example: Deleting a File

```typescript
// Initialize the client
const client = strapi({
  baseURL: 'http://localhost:1337/api',
  auth: 'your-api-token',
});

// Delete a file by ID
const deletedFile = await client.files.delete(1);

console.log('File deleted successfully');
console.log('Deleted file ID:', deletedFile.id);
console.log('Deleted file name:', deletedFile.name);
```

## 📁 Demo Projects

```ts
import { strapi } from '@strapi/client';
import * as dotenv from 'dotenv';
import * as os from 'os';
dotenv.config();

const api_token = process.env.FULL_ACCESS_TOKEN; // READ_ONLY_TOKEN is also available

console.log('Running with api token ' + api_token);

// Create the Strapi client instance
const client = strapi({ baseURL: 'http://localhost:1337/api', auth: api_token });

// Type definitions based on the actual response structure
interface CategoryImage {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: Record<string, unknown>;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: CategoryImage;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface CategoryResponse {
  data: Category[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface FileAttributes {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: Record<string, unknown>;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

async function runDemo() {
  await demonstrateBasicCategoryFunctionality();
  await demonstrateCategoryImageInteractions();
  await demonstrateDirectFileOperations();
  await demonstrateFileUpdates();
  await demonstrateFileDeletion();
}

async function demonstrateBasicCategoryFunctionality() {
  console.log(os.EOL);
  console.log('=== Basic Category Data ===');
  console.log(os.EOL);

  const categories = client.collection('categories');

  const categoryDocs = (await categories.find()) as unknown as CategoryResponse;

  console.log(`Found ${categoryDocs.data.length} categories:`);
  categoryDocs.data.forEach((category) => {
    console.log(`- ${category.name} (${category.slug})`);
  });
}

async function demonstrateCategoryImageInteractions() {
  console.log(os.EOL);
  console.log('=== Categories with their images ===');
  console.log(os.EOL);

  const categories = client.collection('categories');

  // Fetch all categories with their related images
  const result = (await categories.find({
    populate: ['image'],
  })) as unknown as CategoryResponse;

  for (const category of result.data) {
    console.log(`Category: ${category.name}`);

    // Check if the category has an image
    if (category.image) {
      console.log(`  Image: ${category.image.name}`);
      console.log(`  Format: ${category.image.ext}`);
      console.log(`  Size: ${formatFileSize(category.image.size)}`);
      console.log(`  URL: ${category.image.url}`);
    } else {
      console.log('  No image associated with this category');
    }
  }
}

async function demonstrateDirectFileOperations() {
  console.log(os.EOL);
  console.log('=== Direct file queries ===');
  console.log(os.EOL);

  const categories = client.collection('categories');

  // Get a specific category using find with a filter (matching the JS example)
  const techCategoryResult = (await categories.find({
    filters: {
      slug: {
        $eq: 'tech',
      },
    },
    populate: ['image'],
  })) as unknown as CategoryResponse;

  if (techCategoryResult.data && techCategoryResult.data.length > 0) {
    const categoryData = techCategoryResult.data[0];
    console.log(`Working with category: ${categoryData.name} (ID: ${categoryData.id})`);

    // Query files directly using the files API
    if (categoryData.image) {
      const imageId = categoryData.image.id;

      // Get the specific file by ID
      const fileInfo = (await client.files.findOne(imageId)) as unknown as FileAttributes;

      console.log(os.EOL);
      console.log('File details:');
      console.log(`  Name: ${fileInfo.name}`);
      console.log(`  Alternative Text: ${fileInfo.alternativeText || 'None'}`);
      console.log(`  Caption: ${fileInfo.caption || 'None'}`);
      console.log(`  Width: ${fileInfo.width}px`);
      console.log(`  Height: ${fileInfo.height}px`);
      console.log(`  Format: ${fileInfo.ext}`);
      console.log(`  Size: ${formatFileSize(fileInfo.size)}`);
      console.log(`  URL: ${fileInfo.url}`);
    }
  }
}

async function demonstrateFileUpdates() {
  console.log(os.EOL);
  console.log('=== File Update Operations ===');
  console.log(os.EOL);

  const categories = client.collection('categories');

  // Get a specific category using find with a filter
  const techCategoryResult = (await categories.find({
    filters: {
      slug: {
        $eq: 'tech',
      },
    },
    populate: ['image'],
  })) as unknown as CategoryResponse;

  if (techCategoryResult.data && techCategoryResult.data.length > 0) {
    const categoryData = techCategoryResult.data[0];

    // Only proceed if the category has an image
    if (categoryData.image) {
      const imageId = categoryData.image.id;
      console.log(`Working with image: ${categoryData.image.name} (ID: ${imageId})`);

      // Update the file metadata
      // For demo purposes, we'll update the alternative text and caption
      const updatedAltText = `Updated alt text for ${categoryData.image.name} - ${new Date().toISOString()}`;
      const updatedCaption = `Updated caption - ${new Date().toISOString()}`;

      console.log(os.EOL);
      console.log('Updating file metadata...');
      console.log(`  New Alt Text: ${updatedAltText}`);
      console.log(`  New Caption: ${updatedCaption}`);

      try {
        const updatedFile = await client.files.update(imageId, {
          alternativeText: updatedAltText,
          caption: updatedCaption,
        });

        console.log(os.EOL);
        console.log('File metadata updated successfully!');
        console.log(`  Name: ${updatedFile.name}`);
        console.log(`  Alternative Text: ${updatedFile.alternativeText || 'None'}`);
        console.log(`  Caption: ${updatedFile.caption || 'None'}`);
        console.log(`  Updated At: ${new Date(updatedFile.updatedAt).toLocaleString()}`);
      } catch (error) {
        console.error('Error updating file:', error);
      }
    } else {
      console.log('No image associated with this category to update');
    }
  } else {
    console.log(
      'Tech category not found. Make sure you have a category with slug "tech" in your Strapi instance.'
    );
  }
}

const PERFORM_ACTUAL_DELETE = false;
async function demonstrateFileDeletion() {
  if (!PERFORM_ACTUAL_DELETE) {
    return;
  }

  console.log(os.EOL);
  console.log('=== File Deletion Operations ===');
  console.log(os.EOL);

  const getFileThatCanBeDeleted = async (): Promise<number | null> => {
    try {
      const files = await client.files.find();
      if (files && files.length > 0) {
        const fileToDelete = files[0];
        console.log(`Found file to delete: ${fileToDelete.name} (ID: ${fileToDelete.id})`);
        return fileToDelete.id;
      }
      return null;
    } catch (error) {
      console.error('Error finding files:', error);
      return null;
    }
  };

  const fileIdToDelete = await getFileThatCanBeDeleted();

  if (fileIdToDelete) {
    console.log(os.EOL);
    console.log(`Attempting to delete file with ID: ${fileIdToDelete}`);

    try {
      const deletedFile = await client.files.delete(fileIdToDelete);
      console.log('Deleted file metadata:', deletedFile);

      console.log(os.EOL);
      console.log(`Attempting to find deleted file with ID: ${fileIdToDelete}`);
      try {
        const file = await client.files.findOne(fileIdToDelete);
        console.error('Unexpected result: File still exists:', file);
      } catch (error) {
        console.log('Expected error: File no longer exists');
        console.log(`Error message: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error('Error during file deletion demonstration:', error);
    }
  } else {
    console.log('No files available for deletion demonstration.');
  }
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Run the demo
runDemo()
  .then(() => {
    console.log(os.EOL);
    console.log('Demo completed successfully!');
  })
  .catch((error) => {
    console.error('Error running demo:', error);
  });
```