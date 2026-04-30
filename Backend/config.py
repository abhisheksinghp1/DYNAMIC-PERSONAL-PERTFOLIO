from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = "aps11102003@gmail.com"
    smtp_password: str = ""
    smtp_tls: bool = True
    owner_email: str = "aps11102003@gmail.com"
    send_confirmation_to_sender: bool = True

    # JWT secret — change this to a long random string in production
    secret_key: str = "change-me-to-a-long-random-secret-key-in-production"

    # Admin credentials — set in .env, no defaults in code
    admin_username: str = ""
    admin_password: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
