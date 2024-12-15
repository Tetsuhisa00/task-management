class RemoveTagIdFromTask < ActiveRecord::Migration[7.0]
  def change
    remove_foreign_key :tasks, :tags, column: :ability_id
    remove_reference :tasks, :ability
  end
end
