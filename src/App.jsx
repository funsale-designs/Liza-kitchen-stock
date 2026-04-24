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

    setRecipes([
      ...recipes,
      {
        id: Date.now(),
        name,
        category: category || "Uncategorised",
        portions: Number(portions) || 1,
        ingredients
      }
    ]);

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

    return Object.entries(prep);
  };

  const handlePrint = () => window.print();
  const prepList = generatePrepList();

  return (
    <div className="app">

      <style>{`
        body {
          margin: 0;
          font-family: Arial;
          background: #f2f4f7;
        }

        .app {
          max-width: 100%;
          padding: 12px;
        }

        h1 {
          text-align: center;
          font-size: 26px;
          margin: 10px 0;
          font-weight: 800;
        }

        .sub {
          text-align: center;
          color: #666;
          margin-bottom: 15px;
        }

        .card {
          background: white;
          padding: 18px;
          border-radius: 14px;
          margin-bottom: 14px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        input, textarea {
          width: 100%;
          font-size: 18px;
          padding: 14px;
          margin: 6px 0;
          border-radius: 10px;
          border: 1px solid #ccc;
        }

        textarea {
          min-height: 120px;
        }

        button {
          width: 100%;
          padding: 16px;
          font-size: 18px;
          font-weight: 800;
          border: none;
          border-radius: 12px;
          background: #111;
          color: white;
          margin-top: 8px;
        }

        button:active {
          transform: scale(0.98);
        }

        .prep-item {
          font-size: 18px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .recipe {
          margin-bottom: 18px;
        }

        .recipe strong {
          font-size: 18px;
        }

        ul {
          padding-left: 18px;
        }

        li {
          font-size: 16px;
          margin: 4px 0;
        }

        @media print {
          body * { visibility: hidden; }
          #printArea, #printArea * { visibility: visible; }
          #printArea { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none; }
        }
      `}</style>

      <h1>Liza Kitchen System</h1>
      <div className="sub">Production • Prep • Recipes</div>

      {/* INPUT */}
      <div className="card no-print">
        <div className="title">Add Recipe</div>

        <input placeholder="Recipe name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <input placeholder="Portions" value={portions} onChange={e => setPortions(e.target.value)} />

        <textarea
          placeholder={`rice,40,g\nsalad,0.25,cup\nchicken,150,g`}
          value={ingredientInput}
          onChange={e => setIngredientInput(e.target.value)}
        />

        <button onClick={addRecipe}>ADD RECIPE</button>
      </div>

      {/* UPLOAD */}
      <div className="card no-print">
        <div className="title">Upload Excel</div>
        <input type="file" onChange={handleFileUpload} />
      </div>

      {/* PRINT */}
      <div className="no-print">
        <button onClick={handlePrint}>PRINT PREP LIST</button>
      </div>

      {/* OUTPUT */}
      <div id="printArea">

        <div className="card">
          <div className="title">Recipes</div>

          {recipes.map(r => (
            <div key={r.id} className="recipe">
              <strong>{r.name}</strong> ({r.category}) - {r.portions} portions

              <ul>
                {r.ingredients.map((i, idx) => (
                  <li key={idx}>
                    {i.name} — {i.amountPerPortion}{i.unit}/person
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="title">PREP LIST</div>

          {prepList.map(([item, qty]) => (
            <div key={item} className="prep-item">
              <strong>{item}</strong> = {qty}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
