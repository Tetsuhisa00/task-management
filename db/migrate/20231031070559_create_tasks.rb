class CreateTasks < ActiveRecord::Migration[7.0]
  def change
    create_table :tasks do |t|
      t.string :title
      t.references :user, null: false, foreign_key: true
      t.text :description
      t.references :status, null: false, foreign_key: true
      t.references :priority, null: false, foreign_key: true
      t.date :due_date
      t.references :tag, null: false, foreign_key: true
      t.references :shape, null: false, foreign_key: true

      t.timestamps
    end
  end
end
