import pprint
import re
from decimal import Decimal


def parse_search_query(search: str, is_superuser: bool) -> dict:
    """Parses a search string intelligently into different filters, including head:, subhead:, and pay_to:."""
    filters = {
        "payment_method": None,
        "date": None,
        "amount_range": None,
        "head": None,
        "subhead": None,
        "pay_to": None,
        "general": [],
    }

    # Define recognized prefixes
    known_prefixes = ["head:", "subhead:", "pay_to:"]

    words = search.split()
    i = 0

    while i < len(words):
        word = words[i]
        print(word)

        if re.match(r"^\d{1,2}/\d{1,2}$", word):  # Matches MM/DD format
            filters["date"] = word.replace("/", "-")  # Store in consistent MM-DD format
        elif re.match(r"^\d+-\d+$", word):  # Matches amount range (e.g., "1000-5000")
            filters["amount_range"] = tuple(map(Decimal, word.split("-")))
        elif word.lower() in ["bank", "cash"]:  # Payment methods
            filters["payment_method"] = word.lower()
        elif any(word.lower().startswith(prefix) for prefix in known_prefixes):  # Handle dynamic key-value pairs
            for prefix in known_prefixes:
                if word.lower().startswith(prefix):
                    key = prefix.replace(":", "")  # Extract key name (e.g., "head", "subhead", "pay_to")
                    value = " ".join(words[i:]).split(";")[0].replace(prefix, "").strip()
                    filters[key] = value  # Store extracted value

                    # Skip words until the semicolon is found
                    while i < len(words) and ";" not in words[i]:
                        i += 1
        elif len(word) > 2:  # Assume longer words might be general search terms
            filters["general"].append(word.strip())

        i += 1

    # Superusers can search by username, regular users can't
    if is_superuser and filters["general"]:
        filters["username"] = filters["general"].pop(0)  # First word assumed to be username

    return filters


# Test the function
pprint.pprint(parse_search_query("head:tr; subhead:annual; pay_to:sana; safi", True))
