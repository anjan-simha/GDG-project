import os
import sys
from dotenv import load_dotenv

def main():
    # Load environment variables from .env
    load_dotenv()

    # Get sample env variable
    api_key = os.getenv("API_KEY", "NOT_SET")
    
    print(f"Example tool running. API_KEY state: {'SET' if api_key != 'NOT_SET' else 'NOT_SET'}")

    # Ensure .tmp exists for processing
    tmp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp')
    os.makedirs(tmp_dir, exist_ok=True)

    # Do some deterministic logic
    example_output_path = os.path.join(tmp_dir, 'example_output.txt')
    try:
        with open(example_output_path, 'w') as f:
            f.write("This is a temporary output file generated during execution.\n")
        print(f"Successfully wrote intermediate file to {example_output_path}")
    except Exception as e:
        print(f"Error writing to file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
