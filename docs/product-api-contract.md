# Product API Contract

**Project:** Rental Management\
**API base path:** `/api/v1`\
**Resource:** Products\
**Contract version:** 1.0\
**Status:** Derived from the supplied Postman request/response examples

------------------------------------------------------------------------

## 1. Overview

The Products API supports product category discovery, public product
browsing and search, product detail retrieval, product creation and
updates by authorized staff, and product archiving.

### Base URL

Configure the environment variable `{{baseUrl}}` to the server origin,
for example:

``` text
{{baseUrl}}/api/v1
```

All paths below are relative to the configured base URL.

### Response conventions

Successful responses shown in the supplied examples use:

``` json
{
  "success": true
}
```

Error responses shown in the examples use:

``` json
{
  "success": false,
  "message": "Human-readable error message"
}
```

The API examples do not establish a complete HTTP status-code mapping.
Clients should use the actual HTTP status code and the response body.

------------------------------------------------------------------------

## 2. Authentication and authorization

  -----------------------------------------------------------------------
  Operation               Access indicated by     Required permission /
                          examples                behavior
  ----------------------- ----------------------- -----------------------
  Get categories          Public                  No authentication shown

  List active products    Public                  Returns active products
                                                  by default

  Get product details     Public for active       Archived products
                          products                should not be exposed
                                                  through public access

  Create product          Admin / authorized      Requires
                          internal staff          `inventory.manage`

  Update product          Internal staff          Requires authentication
                                                  and suitable
                                                  authorization

  Archive product         Admin                   Requires administrative
                                                  authorization

  List archived products  Internal staff          `status=archived` is
                                                  available to staff

  Get archived product    Internal staff          Staff can retrieve
  details                                         archived product
                                                  details
  -----------------------------------------------------------------------

Authorization examples establish that: - An unauthenticated create
request is rejected with `Authentication required. Please log in.` - A
customer attempting to create a product is rejected with
`Forbidden: Lacking permission 'inventory.manage'.` - Public product
listing excludes archived products. - Staff can list and retrieve
archived products.

The supplied examples do not define the exact authentication header or
token format. Use the authentication mechanism configured by the
application.

------------------------------------------------------------------------

## 3. Endpoints

  ---------------------------------------------------------------------------------------------
  Method            Endpoint                                Purpose           Access
  ----------------- --------------------------------------- ----------------- -----------------
  `GET`             `/api/v1/categories`                    Get available     Public
                                                            product           
                                                            categories        

  `POST`            `/api/v1/products`                      Create a product  Admin /
                                                                              authorized staff

  `GET`             `/api/v1/products`                      List, search,     Public;
                                                            sort, and filter  staff-only
                                                            products          options require
                                                                              authorization

  `GET`             `/api/v1/products/:productId`           Get product       Public for active
                                                            details           products; staff
                                                                              can access
                                                                              archived products

  `PATCH`\*         `/api/v1/products/:productId`           Update product    Internal staff
                                                            fields            

  `POST`\*          `/api/v1/products/:productId/archive`   Archive a product Admin
  ---------------------------------------------------------------------------------------------

\*The supplied examples show the update and archive paths and payloads
but do not include the HTTP method explicitly. Confirm the methods
against the implemented routes before treating these two method labels
as final. `PATCH` and `POST` are suggested here based on the operation
semantics.

------------------------------------------------------------------------

## 4. Get product categories

**Request**

``` http
GET /api/v1/categories
```

**Access:** Public

**Example response**

``` json
{
  "success": true,
  "categories": [
    { "label": "All Categories", "value": "All Categories" },
    { "label": "Cameras & Accessories", "value": "Cameras & Accessories" },
    { "label": "Power Tools", "value": "Power Tools" },
    { "label": "AV Equipment", "value": "AV Equipment" },
    { "label": "Furniture & Event", "value": "Furniture & Event" },
    { "label": "Cleaning & Outdoor", "value": "Cleaning & Outdoor" },
    { "label": "Camping & Adventure", "value": "Camping & Adventure" },
    { "label": "Audio & DJ", "value": "Audio & DJ" }
  ]
}
```

`All Categories` is a client-facing filter option shown in the response.
The valid product categories for creation are the seven named categories
other than `All Categories`.

------------------------------------------------------------------------

## 5. Create a product

**Request**

``` http
POST /api/v1/products
Content-Type: application/json
```

**Access:** Admin / authorized internal staff with `inventory.manage`

### Request body

``` json
{
  "name": "Test Camera",
  "sku": "TEST-CAM-001",
  "description": "Product description",
  "category": "Cameras & Accessories",
  "color": "Black",
  "images": [
    {
      "url": "https://example.com/camera.jpg",
      "alt": "Camera front view",
      "sortOrder": 0
    }
  ],
  "keywords": ["camera", "photography", "mirrorless"],
  "isRentable": true,
  "basePrice": 25000,
  "currency": "INR",
  "pricingRules": [
    {
      "duration": "1 Day",
      "pricelist": "Standard",
      "price": 1200,
      "isActive": true
    },
    {
      "duration": "1 Week",
      "pricelist": "Premium",
      "price": 6500,
      "isActive": true
    }
  ],
  "reservationCharges": {
    "extraHour": 100,
    "extraDay": 500,
    "additionalCharge": 0
  }
}
```

### Field reference

  ---------------------------------------------------------------------------------------
  Field                                   Type                    Description
  --------------------------------------- ----------------------- -----------------------
  `name`                                  string                  Product display name

  `sku`                                   string                  Product SKU; must be
                                                                  unique

  `description`                           string                  Product description

  `category`                              string                  Must match a valid
                                                                  product category

  `color`                                 string                  Product color

  `images`                                array                   Product images, each
                                                                  with `url`, `alt`, and
                                                                  `sortOrder`

  `keywords`                              string array            Search terms associated
                                                                  with the product

  `isRentable`                            boolean                 Indicates whether the
                                                                  product can be rented

  `basePrice`                             number                  Base/product price

  `currency`                              string                  Currency code; example
                                                                  uses `INR`

  `pricingRules`                          array                   Rental pricing rules

  `pricingRules[].duration`               string or duration      Examples use labels
                                          object                  such as `1 Day`; an
                                                                  invalid-duration
                                                                  example also shows a
                                                                  nested object
                                                                  containing
                                                                  `durationValue` and
                                                                  `durationUnit`

  `pricingRules[].pricelist`              string                  Pricing list name

  `pricingRules[].price`                  number                  Price for the specified
                                                                  duration and list

  `pricingRules[].isActive`               boolean                 Whether the pricing
                                                                  rule is active

  `reservationCharges.extraHour`          number                  Extra-hour charge

  `reservationCharges.extraDay`           number                  Extra-day charge

  `reservationCharges.additionalCharge`   number                  Additional charge
  ---------------------------------------------------------------------------------------

### Successful response

The response includes `success`, `message`, and `product`. The created
product example includes: - `id` and generated `slug` - Product fields -
Normalized `rentalPricing` entries using `durationValue` and
`durationUnit` - Flattened charge fields: `extraHourCharge`,
`extraDayCharge`, `additionalCharge` - Audit fields: `createdBy`,
`updatedBy`, `createdAt`, and `updatedAt`

The list/detail responses also expose a convenience `image` field
containing the primary image URL, as well as `price` mirroring
`basePrice` in the supplied examples.

------------------------------------------------------------------------

## 6. List, search, filter, and sort products

**Request**

``` http
GET /api/v1/products
```

### Query parameters

  -------------------------------------------------------------------------------
  Parameter         Type              Example                   Behavior
                                                                evidenced by
                                                                examples
  ----------------- ----------------- ------------------------- -----------------
  `page`            integer           `1`                       Page number;
                                                                example defaults
                                                                to page 1

  `limit`           integer           `12`                      Page size;
                                                                examples use 12
                                                                and 100

  `q`               string            `camera`                  Searches products
                                                                by a query term;
                                                                maximum length is
                                                                200 characters

  `category`        string            `Cameras & Accessories`   Filters by
                                                                category

  `minPrice`        number            `1000`                    Minimum
                                                                base-price filter

  `maxPrice`        number            `30000`                   Maximum
                                                                base-price filter

  `sortBy`          string            `name`                    Supported fields
                                                                shown: `name`,
                                                                `price`,
                                                                `createdAt`,
                                                                `updatedAt`

  `sortOrder`       string            `asc`                     Example supports
                                                                `asc`; descending
                                                                behavior should
                                                                be verified
                                                                against
                                                                implementation

  `status`          string            `archived`                Staff can use
                                                                this to list
                                                                archived products
  -------------------------------------------------------------------------------

### Examples

Search by term:

``` http
GET /api/v1/products?q=camera&page=1&limit=12
```

Filter by category:

``` http
GET /api/v1/products?category=Cameras%20%26%20Accessories&page=1&limit=12
```

Filter by base-price range:

``` http
GET /api/v1/products?minPrice=1000&maxPrice=30000&page=1&limit=12
```

Sort alphabetically:

``` http
GET /api/v1/products?page=1&limit=12&sortBy=name&sortOrder=asc
```

List archived products (staff access):

``` http
GET /api/v1/products?status=archived&page=1&limit=100
```

### Successful response shape

``` json
{
  "success": true,
  "products": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "totalPages": 0
  },
  "filters": {
    "q": null,
    "category": null,
    "sortBy": "name",
    "sortOrder": "asc"
  }
}
```

The `filters` object reflects the applied search and sorting inputs. The
examples show `q` and `category` as `null` when they were not supplied.

### Search behavior

The supplied test confirms that `q=camera` returns a matching camera
product and that product `keywords` are included in the product data.
The examples do not prove the complete matching algorithm or guarantee
semantic/synonym search. Search matching across names, descriptions,
SKUs, categories, and keywords should be verified in implementation
tests.

------------------------------------------------------------------------

## 7. Get product details

**Request**

``` http
GET /api/v1/products/:productId
```

Example:

``` http
GET /api/v1/products/6ae1e28a34c83738d0341c2c
```

### Successful response shape

``` json
{
  "success": true,
  "product": {
    "id": "6ae1e28a34c83738d0341c2c",
    "name": "Test Camera",
    "slug": "test-camera",
    "sku": "TEST-CAM-001",
    "description": "Product description",
    "category": "Cameras & Accessories",
    "color": "Black",
    "images": [
      {
        "url": "https://example.com/camera.jpg",
        "alt": "Camera front view",
        "sortOrder": 0
      }
    ],
    "image": "https://example.com/camera.jpg",
    "keywords": ["camera", "photography", "mirrorless"],
    "isRentable": true,
    "status": "active",
    "price": 25000,
    "basePrice": 25000,
    "currency": "INR",
    "rentalPricing": [
      {
        "durationValue": 1,
        "durationUnit": "day",
        "pricelist": "Standard",
        "price": 1200,
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "duration": "1 Day",
        "durationValue": 1,
        "durationUnit": "day",
        "pricelist": "Standard",
        "price": 1200,
        "isActive": true
      }
    ],
    "reservationCharges": {
      "extraHour": 100,
      "extraDay": 500,
      "additionalCharge": 0
    },
    "extraHourCharge": 100,
    "extraDayCharge": 500,
    "additionalCharge": 0,
    "createdAt": "2026-10-28T11:54:50.292Z",
    "updatedAt": "2026-10-28T11:54:50.292Z"
  }
}
```

The values above are illustrative; use the actual product record
returned by the API. Public detail access is expected to hide archived
products, while staff can retrieve archived product details.

**Important observation:** The supplied test labelled "Public detail
must hide archived product" shows a successful response containing the
archived product. This contradicts the test's stated expectation. Treat
this as a likely implementation or test defect and resolve it before
release.

------------------------------------------------------------------------

## 8. Update a product

**Request path**

``` http
/api/v1/products/:productId
```

**Access:** Internal staff

The supplied example does not state the HTTP method explicitly. Confirm
the implemented route method. The request body is a partial update in
the example:

``` json
{
  "description": "Updated product description",
  "color": "Graphite",
  "keywords": ["camera", "photography", "updated"]
}
```

The response includes `success`, `message`, and the updated `product`.
The example shows `updatedAt` changing while `createdAt` remains
unchanged.

Only send fields intended to be changed. The supplied examples do not
define the full validation behavior for every updateable field or
whether `PUT` or `PATCH` is the implemented method.

------------------------------------------------------------------------

## 9. Archive a product

**Request path**

``` http
/api/v1/products/:productId/archive
```

**Access:** Admin

The supplied example does not state the HTTP method explicitly. Confirm
the implemented route method.

### Successful response shape

``` json
{
  "success": true,
  "message": "Product \"Test Camera\" archived successfully",
  "product": {
    "id": "6ae1e28a34c83738d0341c2c",
    "status": "archived"
  }
}
```

The actual response includes the product fields. Archiving is
represented by changing `status` to `archived`; the supplied example
does not show hard deletion.

Expected visibility rules indicated by the examples: - Public product
listings should exclude archived products. - Public product detail
requests should not expose archived products. - Authorized staff can
list archived products using `status=archived`. - Authorized staff can
retrieve archived product details.

The supplied public-detail test currently contradicts the second rule;
see Section 7.

------------------------------------------------------------------------

## 10. Product data model

### Product fields observed in responses

  -----------------------------------------------------------------------
  Field                   Type                    Notes
  ----------------------- ----------------------- -----------------------
  `id`                    string                  Product identifier

  `name`                  string                  Product name

  `slug`                  string                  Generated URL-friendly
                                                  identifier

  `sku`                   string                  Unique SKU

  `description`           string                  Product description

  `category`              string                  Product category

  `color`                 string                  Product color

  `images`                array                   Image objects

  `image`                 string                  Convenience field for
                                                  primary image URL

  `keywords`              string array            Search keywords

  `isRentable`            boolean                 Rental availability
                                                  flag

  `status`                string                  Examples show `active`
                                                  and `archived`

  `price`                 number                  Mirrors `basePrice` in
                                                  supplied examples

  `basePrice`             number                  Base product price

  `currency`              string                  Example uses `INR`

  `rentalPricing`         array                   Normalized rental price
                                                  entries

  `pricingRules`          array                   Rental pricing rules,
                                                  including display
                                                  duration

  `reservationCharges`    object                  Nested reservation
                                                  charge representation

  `extraHourCharge`       number                  Flattened extra-hour
                                                  charge

  `extraDayCharge`        number                  Flattened extra-day
                                                  charge

  `additionalCharge`      number                  Flattened additional
                                                  charge

  `createdBy`             string                  Present in
                                                  create/update responses

  `updatedBy`             string                  Present in
                                                  create/update responses

  `createdAt`             ISO 8601 string         Creation timestamp

  `updatedAt`             ISO 8601 string         Last-update timestamp
  -----------------------------------------------------------------------

### Rental pricing entry

``` json
{
  "durationValue": 1,
  "durationUnit": "day",
  "pricelist": "Standard",
  "price": 1200,
  "isActive": true
}
```

The examples show `day` and `week` as normalized duration units. An
invalid `year` duration is rejected with `Invalid duration unit: year`.
The complete set of allowed duration units is not established by the
supplied examples.

------------------------------------------------------------------------

## 11. Validation and error responses

### Invalid category

**Example response**

``` json
{
  "success": false,
  "message": "Invalid category: \"Invalid Category\". Valid categories: Cameras & Accessories, Power Tools, AV Equipment, Furniture & Event, Cleaning & Outdoor, Camping & Adventure, Audio & DJ"
}
```

### Invalid rental duration unit

``` json
{
  "success": false,
  "message": "Invalid duration unit: year"
}
```

### Invalid sort field

Request:

``` http
GET /api/v1/products?sortBy=password&page=1&limit=12
```

Response:

``` json
{
  "success": false,
  "message": "Invalid sort field: \"password\". Valid fields: name, price, createdAt, updatedAt"
}
```

### Search query exceeds maximum length

A `q` value longer than 200 characters is rejected:

``` json
{
  "success": false,
  "message": "Search query cannot exceed 200 characters"
}
```

### Duplicate SKU

``` json
{
  "success": false,
  "message": "A product with SKU \"POSTMAN-CAM-001\" already exists"
}
```

### Authentication required

``` json
{
  "success": false,
  "message": "Authentication required. Please log in."
}
```

### Permission denied

``` json
{
  "success": false,
  "message": "Forbidden: Lacking permission 'inventory.manage'."
}
```

The examples do not specify all possible validation errors, error codes,
or HTTP status codes. Those should be documented from the
implementation.

------------------------------------------------------------------------

## 12. Acceptance criteria

-   [ ] Public users can retrieve the product categories.
-   [ ] Authorized staff with the required permission can create
    products.
-   [ ] Duplicate SKUs are rejected.
-   [ ] Invalid categories are rejected.
-   [ ] Invalid rental duration units are rejected.
-   [ ] Public users can list active products with pagination.
-   [ ] Product listing supports query search, category filtering,
    base-price range filtering, and sorting.
-   [ ] Unsupported sort fields are rejected.
-   [ ] Search queries longer than 200 characters are rejected.
-   [ ] Public users can retrieve active product details.
-   [ ] Staff can update permitted product fields.
-   [ ] Admin users can archive products.
-   [ ] Public listings exclude archived products.
-   [ ] Public detail requests hide archived products.
-   [ ] Authorized staff can list and retrieve archived products.
-   [ ] Unauthenticated product creation is rejected.
-   [ ] Customers without `inventory.manage` cannot create products.

------------------------------------------------------------------------

## 13. Items to confirm before treating this as the final contract

1.  **Route methods:** The source examples do not explicitly identify
    the HTTP methods for update and archive. Confirm them from the
    router implementation.
2.  **Category endpoint path:** `/api/v1/categories` is inferred from
    the category response example's label; confirm the actual route.
3.  **Search semantics:** The examples demonstrate a keyword query but
    do not establish synonym/semantic matching or every searchable
    field.
4.  **Sort order:** `asc` is shown. Confirm whether `desc` is supported
    and the default values for all query parameters.
5.  **Archived product detail:** The supplied "public detail must hide
    archived product" test returns the archived product successfully.
    Correct either the implementation or the test expectation.
6.  **Duration schema:** Create examples use a human-readable `duration`
    label, while an invalid example uses an object with `durationValue`
    and `durationUnit`. Define one canonical request schema.
7.  **HTTP status codes:** Record exact status codes for success,
    validation failures, authentication failures, authorization
    failures, duplicates, and missing products.
8.  **Pagination limits:** The examples use `limit=12` and `limit=100`;
    the maximum allowed page size is not specified.
9.  **Product not found behavior:** The response for an unknown product
    ID is not included.
10. **Update validation and editable fields:** Confirm which fields
    staff may update and whether updates use `PUT` or `PATCH`.

------------------------------------------------------------------------

## 14. Example environment variables

For Postman or another API client:

``` text
baseUrl = http://localhost:PORT
productId = <id returned from create product>
productName = <unique product name>
productSku = <unique SKU>
```

Replace `PORT` with the port configured by the server. Use a valid
authenticated admin/staff session for protected operations.
