from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173"

    # Database
    database_url: str = "sqlite:///./intellistudy.db"

    # IBM watsonx.ai
    watsonx_api_key: Optional[str] = None
    watsonx_project_id: Optional[str] = None
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    granite_model_id: str = "ibm/granite-13b-instruct-v2"
    granite_embedding_model: str = "ibm/slate-125m-english-rtrvr"

    # IBM Cloud Object Storage
    ibm_cos_api_key: Optional[str] = None
    ibm_cos_instance_crn: Optional[str] = None
    ibm_cos_endpoint: str = "https://s3.us-south.cloud-object-storage.appdomain.cloud"
    ibm_cos_bucket: str = "intellistudy-uploads"

    # File Upload
    max_upload_size_mb: int = 25
    upload_dir: str = "./storage/uploads"
    allowed_extensions: str = "pdf,docx,txt,jpg,jpeg,png"
    vector_store_path: str = "./storage/vector_store"

    # RAG
    chunk_size: int = 800
    chunk_overlap: int = 100
    top_k_chunks: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def demo_mode(self) -> bool:
        """Returns True if IBM watsonx.ai credentials are not configured."""
        return not (self.watsonx_api_key and self.watsonx_project_id)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def allowed_ext_list(self) -> list[str]:
        return [e.strip().lower() for e in self.allowed_extensions.split(",")]


settings = Settings()
