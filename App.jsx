import { useState } from "react";
import * as XLSX from "xlsx";

export default function KitchenApp() {
  const [recipes, setRecipes] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [portions, setPortions] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");

  const addRecipe = () => {
    if (!name || !ingredientInput) return;

    const ingredients = ingredientInput
      .split("\n")
      .map(line => {
        const [n, amount, unit] = line.split(",").map(x => x.trim());
        if (!n) return null;
        return {
          name: n,
          amountPerPortion: Number(amount) || 0,
          unit: unit || ""
        };
      })
      .filter(Boolean);

    const newRecipe = {
      id: Date.now(),
      name,
      category: category || "Uncategorised",
      portions: Number(portions) || 1,
      ingredients
    };

    setRecipes([...recipes, newRecipe]);
    setName("");
    setCategory("");
    setPortions("");
    setIngredientInput("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const grouped = {};

      json.forEach(row => {
        const recipeName = row.Recipe;
        if (!recipeName) return;

        if (!grouped[recipeName]) {
          grouped[recipeName] = {
            category: row.Category || "Uncategorised",
            portions: Number(row.Portions) || 1,
            ingredients: []
          };
        }

        if (row.Ingredient) {
          grouped[recipeName].ingredients.push({
            name: row.Ingredient,
            amountPerPortion: Number(row.Amount) || 0,
            unit: row.Unit || ""
          });
        }
      });

      const newRecipes = Object.entries(grouped).map(([name, data]) => ({
        id: Date.now() + Math.random(),
        name,
        category: data.category,
        portions: data.portions,
        ingredients: data.ingredients
      }));

      setRecipes(prev => [...prev, ...newRecipes]);
    };

    reader.readAsArrayBuffer(file);
  };

  const generatePrepList = () => {
    const prep = {};

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(item => {
        const key = `${item.name} (${item.unit})`;
        const total = item.amountPerPortion * recipe.portions;
        prep[key] = (prep[key] || 0) + total;
      });
    });

    return Object.entries(prep).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const handlePrint = () => window.print();

  const prepList = generatePrepList();

  return (
    <div className="container">

      <style>{`
        body {
          margin: 0;
          background: #f7f7f7;
          font-family: Arial, sans-serif;
        }

        .container {
          max-width: 900px;
          margin: auto;
          padding: 20px;
        }

        h1 {
          text-align: center;
          margin-bottom: 25px;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        input, textarea {
          width: 100%;
          padding: 10px;
          margin: 6px 0;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        button {
          margin-top: 10px;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: #111;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        button:hover {
          background: #333;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          body * { visibility: hidden; }
          #printArea, #printArea * { visibility: visible; }
          #printArea { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none; }
        }
      `}</style>

      <h1>Kitchen Production System</h1>

      <div className="grid no-print">
        <div className="card">
          <h3>Add Recipe</h3>
          <input placeholder="Recipe name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
          <input placeholder="Portions" value={portions} onChange={e => setPortions(e.target.value)} />

          <textarea
            rows={5}
            placeholder={`rice,40,g\nsalad,0.25,cup`}
            value={ingredientInput}
            onChange={e => setIngredientInput(e.target.value)}
          />

          <button onClick={addRecipe}>Add Recipe</button>
        </div>

        <div className="card">
          <h3>Upload Excel</h3>
          <input type="file" onChange={handleFileUpload} />
          <p>Format: Recipe | Category | Portions | Ingredient | Amount | Unit</p>
        </div>
      </div>

      <div className="no-print">
        <button onClick={handlePrint}>Print Prep List</button>
      </div>

      <div id="printArea" className="grid">
        <div className="card">
          <h3>Recipes</h3>
          {recipes.map(r => (
            <div key={r.id}>
              <strong>{r.name}</strong> ({r.category}) - {r.portions} portions
              <ul>
                {r.ingredients.map((i, idx) => (
                  <li key={idx}>{i.name} — {i.amountPerPortion}{i.unit}/person</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Prep List</h3>
          <ul>
            {prepList.map(([item, qty]) => (
              <li key={item}>{item}: {qty}</li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
