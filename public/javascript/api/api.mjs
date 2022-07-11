export const getText = async (id) => {
  const text = await fetch(`http://localhost:3002/game/texts/${id}`);

  return text.json();
};
