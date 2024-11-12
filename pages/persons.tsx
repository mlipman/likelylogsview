import {useState, useEffect} from "react";
import styles from "../styles/Home.module.css";

interface Person {
  id: number;
  name: string;
  age: number;
}

export default function Persons() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    const response = await fetch("/api/person");
    const data = await response.json();
    setPersons(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Update
      await fetch("/api/person", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: editingId, name, age}),
      });
    } else {
      // Create
      await fetch("/api/person", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, age}),
      });
    }

    setName("");
    setAge("");
    setEditingId(null);
    fetchPersons();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/person?id=${id}`, {method: "DELETE"});
    fetchPersons();
  };

  const handleEdit = (person: Person) => {
    setEditingId(person.id);
    setName(person.name);
    setAge(person.age.toString());
  };

  return (
    <div className={styles.container}>
      <h1>Persons</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
        <button type="submit">
          {editingId ? "Update Person" : "Add Person"}
        </button>
      </form>

      <ul>
        {persons.map((person) => (
          <li key={person.id}>
            {person.name} ({person.age} years old)
            <button onClick={() => handleEdit(person)}>Edit</button>
            <button onClick={() => handleDelete(person.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
