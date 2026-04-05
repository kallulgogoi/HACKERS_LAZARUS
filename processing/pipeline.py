from PHARMA_ENGINE.modules.database_loader import DrugDatabase
from PHARMA_ENGINE.modules.decryption import get_valid_drug       
from PHARMA_ENGINE.modules.prescription_validator import validate_prescription
from PHARMA_ENGINE.modules.conflict_checker import check_conflicts
from PHARMA_ENGINE.modules.risk_engine import calculate_risk, risk_level
from PHARMA_ENGINE.modules.graph_engine import DrugGraph

# Using the paths exactly as you defined them
db = DrugDatabase("PHARMA_ENGINE/data/drug_database.json")
graph_engine = DrugGraph("PHARMA_ENGINE/data/drug_database.json")   

def process_prescription(encrypted_drugs):
    
    # 1. DECRYPT
    decrypted = []
    for d in encrypted_drugs:
        drug = get_valid_drug(d, db)
        if drug:
            decrypted.append(drug)
        else:
            # 🔥 CRITICAL FIX: If we can't crack the cipher (or it's not in the DB), 
            # keep the raw string! Your validator will correctly flag it as 'invalid'.
            decrypted.append(d)

    # 2. VALIDATE (Using your exact module)
    validation = validate_prescription(decrypted, db)
    valid_drugs = validation["valid_drugs"]

    # 3. CHECK CONFLICTS (Using your exact module)
    conflicts = check_conflicts(valid_drugs, db)
    graph_conflicts = graph_engine.get_conflicts(valid_drugs)

    # 4. CALCULATE RISK (Using your exact module)
    score = calculate_risk(conflicts)
    level = risk_level(score)

    # 5. GRAPH METRICS (Using your exact module)
    network_score = graph_engine.compute_intersection_severity(valid_drugs)
    network_level = risk_level(network_score)

    # 6. RETURN PERFECT JSON
    return {
        "decoded_drugs": decrypted,
        "valid_drugs": valid_drugs,
        "invalid_drugs": validation["invalid_drugs"],
        "warnings": validation["warnings"],
        "conflicts": conflicts,
        "risk_score": score,
        "risk_level": level,
        "graph_conflicts": graph_conflicts,
        "network_risk_score": network_score,
        "network_risk_level": network_level
    }