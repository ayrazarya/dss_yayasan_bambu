from datetime import datetime
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import gspread
from dotenv import load_dotenv
from typing import List, Dict, Optional
import hashlib

class SheetService:
    def __init__(self):
        gc = gspread.service_account(filename=os.getenv('SERVICE_ACCOUNT_PATH'))
        self.client = gc
    
    def get_form_responses(self, spreadsheet_id: str) -> List[Dict]:
        """
        Get form responses with only needed columns and calculated fields
        using gspread for simpler API access
        """
        try:
            # Open the spreadsheet and worksheet
            spreadsheet = self.client.open_by_key(spreadsheet_id)
            worksheet = spreadsheet.get_worksheet(0)
            
            # Get all records as dictionaries
            kvp_data = worksheet.get_all_records()
            
            processed = []
            for row in kvp_data:
                try:
                    # Create unique fingerprint for each response
                    fingerprint = hashlib.md5(
                        f"{row['Timestamp']}{row['Email Address']}".encode()
                    ).hexdigest()
                    
                    # Calculate average rating from two columns
                    rating1 = float(row.get('3. Seberapa tertarik anda dengan produk ini?', 0))
                    rating2 = float(row.get('6. Seberapa besar kemungkinan anda akan membeli produk ini di waktu yang akan datang?', 0))
                    avg_rating = (rating1 + rating2) / 2

                    # Parse timestamp to be compatible with Pydantic
                    timestamp = datetime.strptime(row.get('Timestamp'), '%d/%m/%Y %H:%M:%S').isoformat()
                    
                    processed.append({
                        'fingerprint': fingerprint,
                        'email': row.get('Email Address'),
                        'timestamp': timestamp,
                        'rating': avg_rating,
                        'raw_data': row  # Store complete data for audit
                    })
                except (ValueError, KeyError) as e:
                    print(f"Skipping malformed row: {e}")
                    continue
                    
            return processed
            
        except gspread.exceptions.APIError as e:
            print(f"Google Sheets API error: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error: {e}")
            return []