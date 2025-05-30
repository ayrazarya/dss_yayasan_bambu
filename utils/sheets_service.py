import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

class SheetService:
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    TOKEN_PATH = "token.json"

    def __init__(self):
        load_dotenv()
        creds = None

        if os.path.exists(self.TOKEN_PATH):
            creds = Credentials.from_authorized_user_file(self.TOKEN_PATH, self.SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(os.getenv("OAUTH_PATH"), self.SCOPES)
                creds = flow.run_local_server(port=0)
            with open(self.TOKEN_PATH, "w") as token:
                token.write(creds.to_json())

        self.creds = creds

    def get_sheet_data(self, spreadsheet_id, range_name):
        try:
            service = build("sheets", "v4", credentials=self.creds)
            sheet = service.spreadsheets()
            result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
            values = result.get("values", [])
            if not values:
                print("No data found.")
                return []
            return values
        except HttpError as err:
            print(err)
            return []