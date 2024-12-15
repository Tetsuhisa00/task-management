class CreateTaskRelations < ActiveRecord::Migration[7.0]
  def change
    create_table :task_relations do |t|
      t.references :start_task, null: false, foreign_key: { to_table: :tasks }
      t.references :end_task, null: false, foreign_key: { to_table: :tasks }
      t.references :project, null: false, foreign_key: { to_table: :projects }
      t.timestamps
    end
  end
end
