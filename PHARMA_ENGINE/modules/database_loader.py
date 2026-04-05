import json
import os


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..")) 
DB_PATH = os.path.join(BASE_DIR, "PHARMA_ENGINE", "data", "drug_database.json")

class DrugDatabase:
    def __init__(self, path):
    
        if not os.path.exists(path):
            raise FileNotFoundError(f"Lazarus Database not found at: {path}")
            
        with open(path) as f:
            self.data = json.load(f)
        
        self.drug_set = set(self.data.keys())

    def drug_exists(self, drug):
        return drug.upper() in self.data 

    def is_valid_drug(self, drug):
        return drug.upper() in self.drug_set

    def get_interactions(self, drug):
        drug = drug.upper()
        if drug in self.data:
            return self.data[drug].get("interacts_with", {})
        return {}