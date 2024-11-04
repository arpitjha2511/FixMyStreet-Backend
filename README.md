# FixMyStreet API Documentation

## Notes

- Ensure that each request to **ngrok** endpoints includes `ngrok-skip-browser-warning` header set to `true`.
- For image uploads, ensure that images are base64 encoded before sending in the request body.

## Base URL
The base URL for all requests is:  
`https://pumped-enough-newt.ngrok-free.app`

---

## Endpoints

### 1. Login
Authenticate an admin user to access the system.

- **URL**: `/login`
- **Method**: `POST`
- **Body Parameters**:
  - `name` (string, required) - Admin username
  - `password` (string, required) - Admin password
- **Response**:
  - **Success**: 200 OK, returns a success message and a session token
  - **Failure**: 401 Unauthorized, returns an error message if credentials are invalid

---

### 2. Get All Pothole Cases
Retrieve a list of all reported pothole cases.

- **URL**: `/getAllCases`
- **Method**: `GET`
- **Headers**:
  - `ngrok-skip-browser-warning`: `true`
  - `Content-Type`: `application/json`
- **Response**:
  - **Success**: 200 OK, returns an array of pothole cases in JSON format
  - **Example**:
    ```json
    [
      {
        "_id": "64cdef123456789",
        "address": "123 Main St",
        "latitude": "40.7128",
        "longitude": "-74.0060",
        "submittedBy": "John Doe",
        "resolved": false,
        "image": "https://example.com/image.png"
      }
    ]
    ```

---

### 3. Get Resolved Cases
Retrieve a list of all resolved pothole cases.

- **URL**: `/getAllResolved`
- **Method**: `GET`
- **Response**:
  - **Success**: 200 OK, returns an array of resolved pothole cases in JSON format

---

### 4. Get Pending Cases
Retrieve a list of all unresolved (pending) pothole cases.

- **URL**: `/getAllPending`
- **Method**: `GET`
- **Response**:
  - **Success**: 200 OK, returns an array of pending pothole cases in JSON format

---

### 5. Get Cases by User
Retrieve a list of all pothole cases submitted by a specific user.

- **URL**: `/getCasesByUser/:name`
- **Method**: `GET`
- **Path Parameters**:
  - `name` (string, required) - Name of the user who submitted the cases
- **Response**:
  - **Success**: 200 OK, returns an array of pothole cases submitted by the specified user in JSON format

---

### 6. Report a Pothole
Submit a new pothole report, including image, location, and details.

- **URL**: `/reportPothole`
- **Method**: `POST`
- **Body Parameters**:
  - `address` (string, required) - Address where the pothole is located
  - `latitude` (string, required) - Latitude coordinate
  - `longitude` (string, required) - Longitude coordinate
  - `submittedBy` (string, required) - Name of the person reporting the pothole
  - `image` (string, optional) - Base64 encoded image of the pothole
- **Response**:
  - **Success**: 201 Created, returns a success message with the ID of the newly created pothole case
  - **Example**:
    ```json
    {
      "message": "Pothole reported successfully",
      "potholeId": "64cdef123456789"
    }
    ```

---

### 7. Mark Pothole as Resolved
Mark a specific pothole case as resolved.

- **URL**: `/markResolved/:id`
- **Method**: `PUT`
- **Path Parameters**:
  - `id` (string, required) - The unique ID of the pothole case to be marked as resolved
- **Response**:
  - **Success**: 200 OK, returns a success message
  - **Example**:
    ```json
    {
      "message": "Pothole marked as resolved"
    }
    ```

---

### 8. Update Pothole Image
Update the image of a reported pothole.

- **URL**: `/updateImage`
- **Method**: `PUT`
- **Body Parameters**:
  - `id` (string, required) - The unique ID of the pothole case
  - `image` (string, required) - Base64 encoded image of the pothole to update
- **Response**:
  - **Success**: 200 OK, returns a success message if the image is updated
  - **Example**:
    ```json
    {
      "message": "Image updated successfully"
    }
    ```

---


