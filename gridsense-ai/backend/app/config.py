from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql://gridsense:gridsense@localhost:5432/gridsense_db"
    secret_key: str = "gridsense-bescom-dev-key-change-in-prod"
    environment: str = "development"
    allowed_origins: str = "http://localhost:5173"
    log_level: str = "INFO"
    synthetic_data_banner: bool = True

    model_config = SettingsConfigDict(env_file=".env")

def get_settings():
    return Settings()

class ThresholdConfig:
    consecutive_intervals_for_flag: int = 4
    drop_threshold: float = 0.60
    spike_threshold: float = 0.40
    peer_zscore_threshold: float = 2.5
    critical_kwh: float = 300.0
    high_kwh: float = 250.0
    moderate_kwh: float = 200.0

def get_thresholds():
    return ThresholdConfig()
