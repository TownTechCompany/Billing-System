from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "BillPOS"
    app_version: str = "2.0.0"
    debug: bool = True
    database_url: str = Field(default="sqlite:///app/db/billing.db", validation_alias="DATABASE_URL")
    upload_folder: str = "app/static/uploads"
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

settings = Settings()
