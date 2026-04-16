import os
import uuid
from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/upload", tags=["Upload"])

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("")
async def upload_image(request: Request, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    base_url = str(request.base_url).rstrip("/")
    url = f"{base_url}/uploads/{filename}"
    return JSONResponse({"url": url})
