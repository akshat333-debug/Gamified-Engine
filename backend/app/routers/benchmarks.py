"""
Benchmarks Router - FLN benchmarks and state statistics
"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])

# Load benchmark data
DATA_PATH = Path(__file__).parent.parent / "data" / "benchmarks.json"

def load_benchmarks():
    """Load benchmark data from JSON file."""
    try:
        with open(DATA_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


@router.get("/nipun")
async def get_nipun_benchmarks():
    """Get NIPUN Bharat FLN benchmarks by grade."""
    data = load_benchmarks()
    return data.get("nipun_bharat", {})


@router.get("/states")
async def get_state_statistics(region: Optional[str] = None):
    """Get state-wise education statistics, optionally filtered by region."""
    data = load_benchmarks()
    states = data.get("state_statistics", [])
    
    if region:
        states = [s for s in states if s.get("region", "").lower() == region.lower()]
    
    return states


@router.get("/states/{state_name}")
async def get_state_details(state_name: str):
    """Get statistics for a specific state."""
    data = load_benchmarks()
    states = data.get("state_statistics", [])
    
    for state in states:
        if state["state"].lower() == state_name.lower():
            # Add comparison with national average
            national = data.get("national_averages", {})
            return {
                **state,
                "comparison": {
                    "literacy_rate_diff": round(state["literacy_rate"] - national.get("literacy_rate", 0), 1),
                    "fln_proficiency_diff": round(state["fln_proficiency"] - national.get("fln_proficiency", 0), 1),
                    "dropout_rate_diff": round(state["dropout_rate"] - national.get("dropout_rate", 0), 1),
                }
            }
    
    raise HTTPException(status_code=404, detail="State not found")


@router.get("/national")
async def get_national_averages():
    """Get national average statistics."""
    data = load_benchmarks()
    return data.get("national_averages", {})


@router.get("/fln-indicators")
async def get_fln_indicators():
    """Get FLN indicator benchmarks by grade."""
    data = load_benchmarks()
    return data.get("fln_indicators", [])


@router.get("/compare")
async def compare_states(state1: str, state2: str):
    """Compare two states on key metrics."""
    data = load_benchmarks()
    states = data.get("state_statistics", [])
    
    s1 = next((s for s in states if s["state"].lower() == state1.lower()), None)
    s2 = next((s for s in states if s["state"].lower() == state2.lower()), None)
    
    if not s1 or not s2:
        raise HTTPException(status_code=404, detail="One or both states not found")
    
    return {
        "state1": s1,
        "state2": s2,
        "comparison": {
            "literacy_rate": s1["literacy_rate"] - s2["literacy_rate"],
            "fln_proficiency": s1["fln_proficiency"] - s2["fln_proficiency"],
            "enrollment_rate": s1["enrollment_rate"] - s2["enrollment_rate"],
            "dropout_rate": s1["dropout_rate"] - s2["dropout_rate"],
        }
    }
